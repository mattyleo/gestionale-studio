import { redirect } from 'next/navigation'

export default function FattureAcquistiPage() {
  redirect('/fornitori?tab=acquisti')
}
