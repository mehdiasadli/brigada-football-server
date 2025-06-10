import * as bcrypt from 'bcryptjs';

export class Crypt {
  private static saltRounds() {
    if (!process.env.SALT_ROUNDS) {
      throw new Error('SALT_ROUNDS is not set');
    }

    return parseInt(process.env.SALT_ROUNDS);
  }

  static async hash(data: string) {
    const saltGenerated = await bcrypt.genSalt(this.saltRounds());
    return await bcrypt.hash(data, saltGenerated);
  }

  static async compare(data: string, hash: string) {
    return await bcrypt.compare(data, hash);
  }
}
