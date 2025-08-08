import { Outlet, Link } from '@remix-run/react'

export default function WorkspacesLayout() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/workspaces" className="text-xl font-semibold">Workspaces</Link>
        <Link to="/workspaces/upload" className="underline">Upload</Link>
      </div>
      <Outlet />
    </div>
  )
}