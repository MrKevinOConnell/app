import { CheckIcon, PlusIcon } from '@heroicons/react/solid'
import { addDoc, collection, doc, getFirestore, query, serverTimestamp, where } from 'firebase/firestore'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore'
import { useForm } from 'react-hook-form'
import { useWallet } from 'use-wallet'
import Button, { PrimaryButton, SecondaryButton } from '../../../../components/Button'
import { LayoutWrapper } from '../../../../components/LayoutWrapper'
import { Modal, ModalActionFooter, ModalBody, ModalTitle } from '../../../../components/Modal'
import PFP from '../../../../components/PFP'
import Spinner from '../../../../components/Spinner'
import { useRequireAuthentication } from '../../../../lib/authenticate'

const db = getFirestore()

const VerifyModal = ({ show, onClose, workproof }) => {
  const requireAuthentication = useRequireAuthentication()
  const { account } = useWallet()

  console.log(workproof)

  return (
    <Modal show={show} onClose={onClose}>
      <ModalTitle>Verify Submission</ModalTitle>
      <ModalBody>
        <div className="flex flex-col gap-4">
          <div>
            <p className="block text-sm font-medium pb-2">
              Description
            </p>
            <div className="whitespace-pre-wrap text-sm font-medium">
              {workproof?.description}
            </div>
          </div>
        </div>
        <div className="pt-8 text-sm">
          💡 You can also earn XPs by reporting false submissions
        </div>
      </ModalBody>
      <ModalActionFooter>
        <div className="w-full flex justify-between">
          <SecondaryButton>
            Report
          </SecondaryButton>
          <PrimaryButton>
            Verify &amp; sign
          </PrimaryButton>
        </div>
      </ModalActionFooter>
    </Modal>
  )
}

const ProofModal = ({ show, onClose, challenge }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
  const requireAuthentication = useRequireAuthentication()
  const { account } = useWallet()

  const submitProof = async (description) => {
    const proof = {
      description,
      author: account,
      roomId: challenge.roomId,
      challengeId: challenge.challengeId,
      created: serverTimestamp(),
    }
    await addDoc(collection(db, 'workproofs'), proof)
  }

  const handleSubmitProof = async (data) => {
    await requireAuthentication()
    await submitProof(data.description)
    onClose()
    reset()
  }

  return (
    <Modal show={show} onClose={onClose}>
      <form onSubmit={handleSubmit(handleSubmitProof)}>
        <ModalTitle>Proof of Work</ModalTitle>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium pb-2">
                Description
              </label>
              <textarea rows="8" {...register("description", { required: true })} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-daonative-dark-100 dark:border-transparent dark:text-daonative-gray-300" />
              {errors.description && (
                <span className="text-xs text-red-400">You need to set a description</span>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalActionFooter>
          <PrimaryButton type="submit">
            {isSubmitting ? (
              <span className="w-4 h-4 mx-auto"><Spinner /></span>
            ) : (
              <>Submit Challenge</>
            )}
          </PrimaryButton>
        </ModalActionFooter>
      </form>
    </Modal>
  )
}

const SubmissionsList = ({ submissions, onVerifyClick }) => (
  <ul>
    {submissions?.map((submission, idx) => (
      <li key={idx} className="py-2">
        <div className="px-4 py-4 sm:px-6 bg-daonative-dark-100 rounded">
          <div className="flex items-center justify-between">
            <div className="flex w-full">
              <div>
                <PFP size={46} address="0x111" />
              </div>
              <div className="pl-4 w-full flex flex-col gap-1">
                <div className="flex justify-between w-full">
                  <p className="text-sm">{submission.author}</p>
                  <p className="text-sm text-gray-500 pr-1">1h</p>
                </div>
                <div className="flex justify-between w-full">
                  <div className="inline-flex gap-1 items-center">
                    <CheckIcon className="w-5 h-5 text-daonative-primary-blue" />
                    <p className="text-sm">0 verifications</p>
                  </div>
                  <PrimaryButton
                    className="text-xs px-2 w-max"
                    onClick={() => onVerifyClick(submission)}
                  >
                    Verify &amp; Earn XPs
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>
    ))}
  </ul>
)

const ChallengeDetails = () => {
  const [showProofModal, setShowProofModal] = useState(false)
  const [proofToVerify, setProofToVerify] = useState(null)
  const { query: params } = useRouter()
  const challengeId = params.challengeId || ''
  const [challenge] = useDocumentData(
    doc(db, 'challenges', challengeId || 'null')
  )
  const [submissionsSnapshot] = useCollection(
    query(collection(db, 'workproofs'), where('challengeId', '==', challengeId))
  )
  const submissions = submissionsSnapshot?.docs.map(doc => ({ ...doc.data(), woorkproofId: doc.id }))

  const handleOpenProofModal = () => setShowProofModal(true)
  const handleCloseProofModal = () => setShowProofModal(false)

  const handleVerifyProof = (workproof) => setProofToVerify(workproof)
  const handleCloseVerifyProof = () => setProofToVerify(null)

  return (
    <LayoutWrapper>
      <ProofModal show={showProofModal} onClose={handleCloseProofModal} challenge={{ ...challenge, challengeId }} />
      <VerifyModal show={!!proofToVerify} onClose={handleCloseVerifyProof} workproof={proofToVerify} />
      <div className="mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-center w-full">
          <h1 className="text-2xl">{challenge?.title}</h1>
        </div>
        <div className="flex flex-col md:flex-row w-full pt-16 gap-4">
          <div className="w-full">
            <h2 className="text-xl py-4">Description</h2>
            <div className="whitespace-pre-wrap">
              {challenge?.description}
            </div>
          </div>
          <div className="w-full">
            <div className="flex justify-between py-4">
              <div>
                <h2 className="text-xl">Submissions</h2>
              </div>
              <div>
                <button className="bg-daonative-primary-blue flex justify-center items-center rounded-full h-8 w-8 p-0" onClick={handleOpenProofModal}>
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <SubmissionsList submissions={submissions} onVerifyClick={(workproof) => handleVerifyProof(workproof)} />
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default ChallengeDetails