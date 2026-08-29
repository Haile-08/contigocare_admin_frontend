import { Link } from 'react-router-dom'

import { paths } from '@/app/router/paths'
import { RegisterForm } from '@/features/auth/ui/RegisterForm'

export function RegisterPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">It takes a moment.</p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to={paths.login} className="font-medium text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
