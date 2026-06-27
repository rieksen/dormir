/**
 * Students API client
 */

import { apiFetch } from "../api";
import type { Student, StudentCreate, StudentUpdate } from "../types";

export async function listStudents(): Promise<Student[]> {
  return apiFetch<Student[]>("/students/");
}

export async function getStudent(id: number): Promise<Student> {
  return apiFetch<Student>(`/students/${id}`);
}

export async function createStudent(data: StudentCreate): Promise<Student> {
  return apiFetch<Student>("/students/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateStudent(id: number, data: StudentUpdate): Promise<Student> {
  return apiFetch<Student>(`/students/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteStudent(id: number): Promise<void> {
  await apiFetch<void>(`/students/${id}`, { method: "DELETE" });
}
