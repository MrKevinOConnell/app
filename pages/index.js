/*
  This example requires Tailwind CSS v2.0+ 
  
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
import { useState } from 'react'

import SidebarNavigation from '../components/SidebarNavigation'
import HeaderNavigation from '../components/HeaderNavigation'
import KPIs from '../components/KPIs'
import Feed from '../components/Feed'
import Tasks from '../components/Tasks'
import Members from '../components/Members'
import TreasuryChart from '../components/TreasuryChart'

export default function Dashboard() {
  const [showSidebarMobile, setShowSidebarMobile] = useState(false)
  return (
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-gray-100">
        <body class="h-full">
        ```
      */}
      <div>
        <SidebarNavigation showMobile={showSidebarMobile} onClose={() => setShowSidebarMobile(false)} />
        <HeaderNavigation onShowSidebar={() => setShowSidebarMobile(true)} />
        <div className="md:pl-64 flex-row md:flex overflow-hidden">
          <main className="w-full py-6">
            <div className="mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">DAOnative</h1>
              <p className="py-2 text-sm">We help you focus on your community by making it easy to create, fund, and manage a DAO.</p>
            </div>
            <div className="py-4 mx-auto px-4 sm:px-6 md:px-8">
              <KPIs />
            </div>
            <div className="py-4 mx-auto px-4 sm:px-6 md:px-8">
              <Feed />
            </div>
            <div className="py-4 mx-auto px-4 sm:px-6 md:px-8">
              <Tasks />
            </div>
          </main>
          <aside className="py-6 w-full md:max-w-xs">
            <div className="py-4 px-4">
              <TreasuryChart />
            </div>
            <div className="py-4 px-4">
              <Members />
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}