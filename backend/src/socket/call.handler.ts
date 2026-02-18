import { Socket, Server } from "socket.io";
import { prisma } from "../config/prisma";

const callTimeouts = new Map<string, NodeJS.Timeout>();  // use in Missed calls
const durationTimeouts = new Map<string, NodeJS.Timeout>(); // use in Call duration

export const callHandler = (io: Server, socket: Socket) => {

    // Start Call
    socket.on('start_call', async ({ targetUserId, type }) => {
        const userId = socket.data.userId;

        if (!userId) {
            socket.emit('call_error', { message: 'You are not authenticated' });
            return;
        }

        if (!targetUserId || !type) {
            socket.emit('call_error', { message: 'Invalid parameters' });
            return;
        }

        if (userId === targetUserId) {
            socket.emit('call_error', { message: 'You cannot call yourself' });
            return;
        }

        const user = await prisma.user.findUnique({ 
            where: { id: userId },
            include: {
                subscription: {
                    where: { isActive: true },
                    include: { plan: true }
                }
            }
        });

        if (!user){
            socket.emit('call_error', { message: 'User not found' });
            return;
        }

        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser){
            socket.emit('call_error', { message: 'Target user not found' });
            return;
        }

        if (!targetUser.isOnline) {
            socket.emit('call_error', { message: 'User is currently offline' });
            return;
        }

        const activePlan = user.subscription?.plan;
        
        if (!user.isPaidMember || !activePlan) {
            socket.emit('call_error', { message: 'You need an active subscription to make calls' });
            return;
        }

        if (type === 'AUDIO' && !activePlan.canAudioCall) {
            socket.emit('call_error', { message: 'Your current plan does not allow Audio calls' });
            return;
        }

        if (type === 'VIDEO' && !activePlan.canVideoCall) {
            socket.emit('call_error', { message: 'Your current plan does not allow Video calls' });
            return;
        }

        const wallet = await prisma.wallet.findUnique({ where: { userId: userId } });
        if (!wallet || wallet.balance < 5) { 
            socket.emit('call_error', { message: "Insufficient tokens (Min 5 required)" });
            return;
        }

        const block = await prisma.block.findFirst({
            where: {
                OR: [
                    { blockerId: userId, blockedId: targetUserId },
                    { blockerId: targetUserId, blockedId: userId }
                ]
            }
        });
        if (block) {
            socket.emit('call_error', { message: "Cannot call this user." });
            return;
        }

        const newCall = await prisma.call.create({ 
            data: {
                callerId: userId,
                receiverId: targetUserId,
                type: type,
                status: "ONGOING"
            },
            include: { caller: { select: { username: true, profile: { select: { name: true, avatar: true } } } }
         }});

         io.to(targetUserId).emit('incoming_call', {
            callId: newCall.id,
            callerId: userId,
            callerName: newCall.caller.profile?.name || newCall.caller.username,
            callerAvatar: newCall.caller.profile?.avatar,
            type
         });

         // 30 sec timeout for handling missed call
         const timeout = setTimeout(async () => {
            const currentCall = await prisma.call.findUnique({ where: { id: newCall.id } });
            
            if (currentCall && currentCall.status === 'ONGOING') {
                await prisma.call.update({
                    where: { id: newCall.id },
                    data: { status: 'MISSED', endTime: new Date() }
                });

                io.to(userId).emit('call_ended', { message: "No answer", reason: "MISSED" });
                io.to(targetUserId).emit('call_missed', { callId: newCall.id, callerId: userId });
                
                callTimeouts.delete(newCall.id);
            }
        }, 30000);

        callTimeouts.set(newCall.id, timeout);
    });

    // accept call handler
    socket.on('accept_call', async ({ callId, callerId }) => {
        if (callTimeouts.has(callId)) {
            clearTimeout(callTimeouts.get(callId));
            callTimeouts.delete(callId);
        }

        await prisma.call.update({
            where: { id: callId },
            data: { startTime: new Date() }
        });

        io.to(callerId).emit('call_accepted', { callId });

        const wallet = await prisma.wallet.findUnique({ where: { userId: callerId } });
        const config = await prisma.systemConfig.findUnique({ where: { id: 'config' } });
        
        // if tokens run out between call
        const balance = wallet?.balance || 0;
        const costPerMinute = config?.callCostPerMinute || 1;

        if (costPerMinute > 0 && balance > 0) {
            const maxMinutes = balance / costPerMinute;
            const maxDurationMs = Math.floor(maxMinutes * 60 * 1000);

            const durationTimer = setTimeout(async () => {
                
                io.to(callerId).emit('call_ended', { message: 'Call ended: Insufficient tokens', reason: 'LOW_BALANCE' });
                io.to(socket.data.userId).emit('call_ended', { message: 'Call ended: Caller ran out of tokens', reason: 'LOW_BALANCE' });

                await endCallAndCharge(callId);
                durationTimeouts.delete(callId);

            }, maxDurationMs);

            durationTimeouts.set(callId, durationTimer);
        }
    });

    // reject call handler
    socket.on('reject_call', async ({ callId, callerId }) => {
        if (callTimeouts.has(callId)) {
            clearTimeout(callTimeouts.get(callId));
            callTimeouts.delete(callId);
        }

        await prisma.call.update({
            where: { id: callId },
            data: { status: 'REJECTED', endTime: new Date() }
        });
        
        io.to(callerId).emit('call_rejected', { message: "User is busy" });
    });

    // end call handler
    socket.on('end_call', async ({ callId, targetUserId }) => {
        if (callTimeouts.has(callId)) {
            clearTimeout(callTimeouts.get(callId));
            callTimeouts.delete(callId);
        }

        if (durationTimeouts.has(callId)) {
            clearTimeout(durationTimeouts.get(callId));
            durationTimeouts.delete(callId);
        }

        io.to(targetUserId).emit('call_ended', { callId });
        await endCallAndCharge(callId);
    });

    // webrtc handlers
    socket.on('webrtc_offer', ({ targetUserId, offer }) => {
        io.to(targetUserId).emit('webrtc_offer', { 
            senderId: socket.data.userId, 
            offer 
        });
    });

    socket.on('webrtc_answer', ({ targetUserId, answer }) => {
        io.to(targetUserId).emit('webrtc_answer', { 
            senderId: socket.data.userId, 
            answer 
        });
    });

    socket.on('webrtc_ice_candidate', ({ targetUserId, candidate }) => {
        io.to(targetUserId).emit('webrtc_ice_candidate', { 
            senderId: socket.data.userId, 
            candidate 
        });
    });
}

const endCallAndCharge = async (callId: string) => {
    
  if (!callId || typeof callId !== 'string') {
      return;
  }

  const call = await prisma.call.findUnique({ where: { id: callId } });
  
  if (!call || call.endTime) return; 

  const endTime = new Date();
  const durationMs = endTime.getTime() - call.startTime.getTime();
  const durationMinutes = Math.ceil(durationMs / 60000); 

  const config = await prisma.systemConfig.findUnique({ where: { id: 'config' } });
  const costPerMinute = config?.callCostPerMinute || 1;
  
  const totalCost = durationMinutes * costPerMinute;

  await prisma.$transaction([
    prisma.call.update({
      where: { id: callId },
      data: { 
        status: 'COMPLETED',
        endTime: endTime,
        tokensConsumed: totalCost
      }
    }),

    prisma.wallet.update({
      where: { userId: call.callerId },
      data: { balance: { decrement: totalCost } }
    })
  ]);
};