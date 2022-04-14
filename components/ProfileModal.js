import React from 'react'
import { CheckIcon } from "@heroicons/react/solid"
import { collectionGroup, doc, getDoc, getDocs, getFirestore, query, updateDoc, where } from "firebase/firestore"
import { useEffect, useState } from "react"
import { useWallet } from "use-wallet"
import { PrimaryButton } from "../components/Button"
import { UserName } from "../components/PFP"
import { Modal, ModalBody, ModalTitle } from "./Modal"

import { classNames } from "../lib/utils"
import { useForm } from "react-hook-form"
import { useRequireAuthentication } from "../lib/authenticate"
import Spinner from "./Spinner"
import { Tab } from '@headlessui/react'


const kFormatter = (num) =>
  Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'k' : Math.sign(num) * Math.abs(num)

const tabs = ['Rewards', 'Settings']


const Tabs = ({ tabs, current, onChange }) => {
  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          defaultValue={current}
        >
          {tabs.map((tab) => (
            <option key={tab}>{tab}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <div
                key={tab}
                className={classNames(
                  tab === current
                    ? 'border-daonative-primary-purple text-daonative-primary-purple'
                    : 'boder-daonative-white text-daonative-white hover:border-daonative-subtitle hover:text-daonative-subtitle',
                  'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm hover:cursor-pointer'
                )}
                aria-current={tab === current ? 'page' : undefined}
                onClick={() => onChange(tab)}
              >
                {tab}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}

const ProfileModal = ({ show, onClose }) => {
  const { account } = useWallet()
  const [submissionCount, setSubmissionCount] = useState(0)
  const [verifiedXps, setVerifiedXps] = useState(0)
  const [currentTab, setCurrentTab] = useState('Rewards')
  const { register, handleSubmit, reset, formState: { isSubmitting, isSubmitSuccessful } } = useForm()
  const requireAuthentication = useRequireAuthentication()

  const updateProfile = async (name, discordHandle) => {
    const db = getFirestore()
    const userRef = doc(db, 'users', account)
    await updateDoc(userRef, { name, discordHandle })
  }

  const handleUpdateProfile = async (data) => {
    await requireAuthentication()
    await updateProfile(data.name, data.discordHandle)
  }

  const tabs = ['Rewards', 'Settings']
  const handleTabChange = (tab) => setCurrentTab(tab)

  useEffect(() => {
    const retrieveUserProfile = async () => {
      const db = getFirestore()
      const userRef = doc(db, 'users', account)
      const userDoc = await getDoc(userRef)
      const { name, discordHandle } = userDoc.data()
      reset({ name, discordHandle })
    }

    if (!account) return
    retrieveUserProfile()
  }, [account])

  useEffect(() => {
    const retrieveLeaderboardPositions = async () => {
      const db = getFirestore()
      const leaderboardPositionsQuery = query(collectionGroup(db, 'leaderboard'), where('userAccount', '==', account || 'x'))
      const leaderboardPositionsSnapshot = await getDocs(leaderboardPositionsQuery)
      const leaderboardPositions = leaderboardPositionsSnapshot.docs.map(doc => doc.data())

      const submissionCount = leaderboardPositions
        .map(leaderboardPosition => leaderboardPosition.submissionCount)
        .reduce((total, currentValue) => total + currentValue, 0)

      const verifiedXps = leaderboardPositions
        .map(leaderboardPosition => leaderboardPosition.verifiedExperience)
        .reduce((total, currentValue) => total + currentValue, 0)

      setSubmissionCount(submissionCount)
      setVerifiedXps(verifiedXps)
    }

    retrieveLeaderboardPositions()
  }, [account])

  return (
    <Modal show={show} onClose={onClose}>
      <ModalTitle>
      <div className="4 mx-auto  flex flex-col ">
          <div className='flex justify-between'>
            <div className='flex flex-col gap-3'>
              <h1 className="text-xl">
                <UserName account={account} />
              </h1>
              <div className="relative flex flex-col">
                <div className="flex flex-col justify-between w-full ">
                  <span className="text-xs text-daonative-subtitle">Role</span>
                  <h2 className="text-m">
                    Guild Hero
                  </h2>

                </div>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              <div>
                <span className="py-0.5 px-4 text-sm rounded-md font-medium bg-blue-100 text-blue-800 font-weight-600 font-space text-center inline">
                  {kFormatter(verifiedXps)} XPs
                </span>
              </div>

              <div className="text-daonative-subtitle text-sm flex">
                <CheckIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-daonative-primary-blue" />
                {submissionCount} Challenges Completed
              </div>
            </div>
          </div>

        </div>
        
      </ModalTitle>
      <ModalBody>
        
        <Tab.Group>

          <Tab.List className={'flex gap-3'}>

            <Tab className={({ selected }) => (classNames(
              selected
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ))}
            >

              Rewards
            </Tab>

            <Tab className={({ selected }) => (classNames(
              selected
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ))}
            >

              Settings
            </Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel> <>

              <div className="flex justify-between w-full items-end pt-8 ">
                <div>
                  <h2 className="text-xl">Latest Rewards</h2>

                </div>

              </div>

              <div className="flex gap-6 relative justify-between">
                <div className="flex gap-6 ">
                  <div className="absolute top-0 left-0 w-full h-full bg-daonative-dark-300 bg-opacity-80">
                    <div className="flex items-center justify-center text-3xl pt-20">
                      Coming soon
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-daonative-subtitle">Undefined contract #5</span>
                    <img src="https://arweave.net/Jf6CQMTDHpNu2jpGrwTSr6V9hdsp7geyqQM0xypenTE" className="w-32 rounded-md" />
                  </div>
                  <div>
                    <span className="text-xs text-daonative-subtitle">Early Adopters Gen 1</span>
                    <img src="https://ipfs.infura.io/ipfs/QmcebJ4PbN3yXKSZoKdf7y7vBo5T4X98VKGULnkdFnAK2m" className="w-32 rounded-md" />
                  </div>

                </div>
                <div className='flex flex-col gap-3'>
                  <div className="flex gap-1">
                    <span className="">{Math.floor(verifiedXps / 10)}</span>
                    <span className="text-daonative-subtitle ">$GREEN</span>
                  </div>
                  <PrimaryButton disabled={true}>Claim</PrimaryButton>
                </div>
              </div>
            </></Tab.Panel>
            <Tab.Panel>  <>

              <form onSubmit={handleSubmit(handleUpdateProfile)}>
                <div className="mx-auto   flex flex-col gap-4 pt-8">
                  <div>
                    <label className="block text-sm font-medium pb-2">
                      Nickname
                    </label>
                    <input type="text" {...register("name", { required: false })} placeholder="Han Solo" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-daonative-component-bg border-transparent text-daonative-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium pb-2">
                      Discord Handle
                    </label>
                    <input type="text" {...register("discordHandle", { required: false })} placeHolder="HanSolo#1244" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-daonative-component-bg border-transparent text-daonative-gray-300" />
                  </div>
                  <div className="flex justify-end gap-4 items-center">
                    {isSubmitSuccessful && <CheckIcon className="h-6 w-6 text-green" />}
                    <PrimaryButton type="submit">
                      {isSubmitting ? (
                        <span className="w-4 h-4 mx-auto"><Spinner /></span>
                      ) : (
                        <>Save</>
                      )}
                    </PrimaryButton>
                  </div>
                </div>
              </form>
            </>
            </Tab.Panel>
            <Tab.Panel>Content 3</Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </ModalBody>
    </Modal >

  )
}

export default ProfileModal