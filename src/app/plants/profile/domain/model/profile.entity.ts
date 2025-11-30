export class User {
  id: number;
  userName: string;
  email: string;
  phoneNumber: string;
  identificator: string;
  password?: string;
  location?: string;
  isLocationPublic?: boolean;

  constructor() {
    this.id = 0;
    this.userName = '';
    this.email = '';
    this.phoneNumber = '';
    this.identificator = '';
    this.password = '';
    this.location = '';
    this.isLocationPublic = true; // Por defecto, la ubicación es pública
  }
}
