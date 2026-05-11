import { redirect } from 'next/navigation';

export default function HomePage() {
  // Keep a single production landing surface.
  redirect('/project.htm');
}
