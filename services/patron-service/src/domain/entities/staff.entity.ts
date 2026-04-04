import { StaffRole } from '@biblioflow/shared-types';
import { Email } from '../value-objects/email.vo';

export interface StaffProps {
  id: string;
  libraryId: string;
  fullName: string;
  email: Email;
  passwordHash: string;
  role: StaffRole;
  permissions: string[];
  isActive: boolean;
}

export class Staff {
  private constructor(private readonly props: StaffProps) {}

  static create(props: StaffProps): Staff {
    return new Staff(props);
  }

  get id(): string { return this.props.id; }
  get libraryId(): string { return this.props.libraryId; }
  get fullName(): string { return this.props.fullName; }
  get email(): Email { return this.props.email; }
  get passwordHash(): string { return this.props.passwordHash; }
  get role(): StaffRole { return this.props.role; }
  get permissions(): string[] { return this.props.permissions; }
  get isActive(): boolean { return this.props.isActive; }

  hasPermission(permission: string): boolean {
    return this.props.permissions.includes(permission) || this.props.role === 'administrator';
  }
}
