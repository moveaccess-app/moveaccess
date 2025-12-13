// Domain Layer - User Entity
// Representa um usuário do sistema com suas propriedades e regras de negócio

export interface UserProps {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private props: UserProps) {
    this.validate();
  }

  static create(props: UserProps): User {
    return new User(props);
  }

  private validate(): void {
    if (!this.props.id || this.props.id.trim() === '') {
      throw new Error('User ID is required');
    }
    
    if (!this.props.name || this.props.name.trim() === '') {
      throw new Error('User name is required');
    }

    if (!this.props.email || !this.isValidEmail(this.props.email)) {
      throw new Error('Valid email is required');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  updateName(newName: string): User {
    if (!newName || newName.trim() === '') {
      throw new Error('Name cannot be empty');
    }
    
    return User.create({
      ...this.props,
      name: newName,
      updatedAt: new Date(),
    });
  }

  updateEmail(newEmail: string): User {
    if (!newEmail || !this.isValidEmail(newEmail)) {
      throw new Error('Valid email is required');
    }

    return User.create({
      ...this.props,
      email: newEmail,
      updatedAt: new Date(),
    });
  }

  toJSON() {
    return {
      id: this.props.id,
      name: this.props.name,
      email: this.props.email,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
