import { UserRole } from "./auth";

export interface Department {
  id: number;
  code: string;
  name: string;
}

export interface Position {
  id: number;
  code: string;
  name: string;
}

export interface Manager {
  id: number;
  employeeCode: string;
  fullName: string;
}

export interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  email?: string;
  phone?: string;
  address?: string;
  hireDate?: string;
  employmentStatus: "WORKING" | "PROBATION" | "RESIGNED" | "TERMINATED";
  department?: Department | null;
  position?: Position | null;
  manager?: Manager | null;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  roles: UserRole[];
  employee?: Employee | null;
}
