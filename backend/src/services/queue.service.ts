interface WaitingUser {
  userId: string;
  socketId: string;
  gender: string;
}

class MatchQueue {
  private males: WaitingUser[] = [];
  private females: WaitingUser[] = [];

  enqueue(userId: string, socketId: string, gender: string) {
    this.remove(userId);
    if (gender === 'MALE') this.males.push({ userId, socketId, gender });
    else if (gender === 'FEMALE') this.females.push({ userId, socketId, gender });
  }

  findMatch(myGender: string): WaitingUser | undefined {
    if (myGender === 'MALE') {
      return this.females.shift(); 
    } else {
      return this.males.shift(); 
    }
  }

  remove(userId: string) {
    this.males = this.males.filter(u => u.userId !== userId);
    this.females = this.females.filter(u => u.userId !== userId);
  }

  print(){
    console.log("Males: ", this.males);
    console.log("Females: ", this.females);
  }
}

export const matchQueue = new MatchQueue();