import { CheckIcon, ClockIcon, PlusIcon, BanIcon } from '@heroicons/react/solid'
import { addDoc, collection, doc, getFirestore, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore'
import { useForm } from 'react-hook-form'
import Moment from 'react-moment'
import { useWallet } from 'use-wallet'
import { PrimaryButton, SecondaryButton } from '../../../../../components/Button'
import EmptyStateNoSubmissions from '../../../../../components/EmptyStateNoSubmissions'
import { LayoutWrapper } from '../../../../../components/LayoutWrapper'
import { Modal, ModalActionFooter, ModalBody, ModalTitle } from '../../../../../components/Modal'
import { UserAvatar, UserName, UserRectangleAvatar } from '../../../../../components/PFP'
import Spinner from '../../../../../components/Spinner'
import { useRequireAuthentication } from '../../../../../lib/authenticate'
import { uploadToIPFS } from '../../../../../lib/uploadToIPFS'
import useMembership from '../../../../../lib/useMembership'
import Linkify from 'linkify-react'
import Link from 'next/link'
import { classNames } from '../../../../../lib/utils'
import { SimpleCard, SimpleCardBody } from '../../../../../components/Card'

const ProofOfWorkModal = ({ show, onClose, workproof }) => {
  const verifications = workproof?.verifications ? Object.values(workproof.verifications) : []
  const isPending = verifications.length === 0
  const isReverted = !isPending && verifications.filter(verification => !verification.accepted).length > 0
  const isVerified = !isPending && !isReverted
  return (
    <Modal show={show} onClose={onClose}>
      <ModalTitle>Proof of Work</ModalTitle>
      <ModalBody>
        <div className="flex flex-col gap-4">
          <div>
            <p className="block text-sm font-medium pb-2 text-daonative-subtitle">
              Description
            </p>
            <div className="whitespace-pre-wrap text-sm font-medium text-daonative-white">
              {workproof?.description}
            </div>
          </div>
          {workproof?.imageUrls?.length > 0 && (
            <div>
              <p className="block text-sm font-medium pb-2 text-daonative-subtitle">
                Image
              </p>
              <div className="whitespace-pre-wrap text-sm font-medium">
                <a href={workproof.imageUrls[0]}>
                  <img src={workproof.imageUrls[0]} width={64} />
                </a>
              </div>
            </div>
          )}
          <div>
            <p className="block text-sm font-medium pb-2 text-daonative-subtitle">
              Status
            </p>
            {isVerified && (
              <div className="inline-flex gap-1 items-center">
                <CheckIcon className="w-5 h-5 text-daonative-primary-blue" />
                <p className="text-sm">Verified</p>
              </div>
            )}
            {isPending && (
              <div className="inline-flex gap-1 items-center text-daonative-white">
                <ClockIcon className="w-5 h-5" />
                <p className="text-sm">Pending</p>
              </div>
            )}
            {isReverted && (
              <div className="inline-flex gap-1 items-center text-daonative-white">
                <BanIcon className="w-5 h-5" />
                <p className="text-sm">Reverted</p>
              </div>
            )}
          </div>
          {verifications.filter(verification => !!verification.reason).length > 0 && (
            <div>
              <p className="block text-sm font-medium pb-2 text-daonative-subtitle">
                Reason
              </p>
              {verifications.map((verification, idx) => (
                <div key={idx} className="whitespace-pre-wrap text-sm font-medium">
                  {verification.reason}
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalActionFooter>
        <div className="w-full flex justify-end">
          <SecondaryButton onClick={onClose}>
            Close
          </SecondaryButton>
        </div>
      </ModalActionFooter>
    </Modal>
  )
}

const SubmitProofOfWorkModal = ({ show, onClose, challenge }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
  const requireAuthentication = useRequireAuthentication()
  const { account } = useWallet()

  const submitProof = async (description, image) => {
    const imageUrl = image?.length === 1 ? await uploadToIPFS(image[0]) : ''
    const proof = {
      description,
      author: account,
      roomId: challenge.roomId,
      challengeId: challenge.challengeId,
      weight: Number(challenge.weight),
      imageUrls: imageUrl ? [imageUrl] : [],
      created: serverTimestamp(),
    }
    const db = getFirestore()
    await addDoc(collection(db, 'workproofs'), proof)
  }

  const handleSubmitProof = async (data) => {
    await requireAuthentication()
    await submitProof(data.description, data.image)
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
              <textarea rows="8" {...register("description", { required: true })} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-daonative-component-bg border-transparent text-daonative-gray-300" />
              {errors.description && (
                <span className="text-xs text-red-400">You need to set a description</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium pb-2">
                Image (optional)
              </label>
              <input {...register("image", { required: false })} type="file" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-100 rounded-md bg-daonative-component-bg border-transparent" />
            </div>
          </div>
        </ModalBody>
        <ModalActionFooter>
          <PrimaryButton type="submit">
            {isSubmitting ? (
              <span className="w-4 h-4 mx-auto"><Spinner /></span>
            ) : (
              <>Submit Proof of Work</>
            )}
          </PrimaryButton>
        </ModalActionFooter>
      </form>
    </Modal>
  )
}

const SubmissionsList = ({ submissions, isAdmin }) => {
  const { account } = useWallet()
  const [proofOfWorkModalOpen, setProofOfWorkModalOpen] = useState(false)
  const [proofOfWorkToShow, setProofOfWorkToShow] = useState(null)

  if (submissions?.length === 0) return <EmptyStateNoSubmissions />

  const handleCloseEditModal = () => {
    setProofOfWorkModalOpen(false)
    setProofOfWorkToShow(null)
  }
  const handleOpenEditModal = (submission) => {
    setProofOfWorkToShow(submission)
    setProofOfWorkModalOpen(true)
  }

  return (
    <>
      <ProofOfWorkModal show={proofOfWorkModalOpen} onClose={handleCloseEditModal} workproof={proofOfWorkToShow} />
      <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {submissions?.map((submission, idx) => {
          const verifications = submission?.verifications ? Object.values(submission.verifications) : []
          const isPending = verifications.length === 0
          const isReverted = !isPending && verifications.filter(verification => !verification.accepted).length > 0
          const isVerified = !isPending && !isReverted
          const isAuthor = submission?.author === account
          const canInspect = isAuthor || isAdmin
          return (
            <li key={idx} >
              <SimpleCard
                onClick={() => canInspect && handleOpenEditModal(submission)}
                className={classNames(
                  canInspect && "hover:cursor-pointer"
                )}
              >
                <div className=' py-2 sm:px-2'>
                  <div className="flex items-center justify-between">
                    <UserRectangleAvatar account={submission.author} />
                    <div className="flex flex-col gap-1 items-end">
                      <p className="text-sm">
                        <UserName account={submission.author} />
                      </p>
                      <p className="text-sm text-gray-500 ">
                        <Moment date={submission?.created?.toMillis()} fromNow={true} />
                      </p>
                      <div className="flex justify-between">
                        {isVerified && (
                          <div className="inline-flex gap-1 items-center">
                            <CheckIcon className="w-5 h-5 text-daonative-primary-blue" />
                            <p className="text-sm">Verified</p>
                          </div>
                        )}
                        {isPending && (
                          <div className="inline-flex gap-1 items-center text-daonative-white">
                            <ClockIcon className="w-5 h-5" />
                            <p className="text-sm">Pending</p>
                          </div>
                        )}
                        {isReverted && (
                          <div className="inline-flex gap-1 items-center text-daonative-white">
                            <BanIcon className="w-5 h-5" />
                            <p className="text-sm">Reverted</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </SimpleCard>
            </li>
          )
        })}
      </ul>
    </>
  )
}

const EditChallengeModal = ({ show, onClose, challenge = {} }) => {
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm()
  const requireAuthentication = useRequireAuthentication()

  useEffect(() => reset(challenge), [reset, challenge])

  const updateChallenge = async (title, description, challengeId) => {
    const db = getFirestore()
    const challenge = {
      title: title,
      description: description,
      updated: serverTimestamp()
    }
    await updateDoc(doc(db, "challenges", challengeId), challenge)
  }

  const handleCloseModal = () => {
    onClose()
  }

  const handleSaveChallenge = async (data) => {
    await requireAuthentication()
    await updateChallenge(data.title, data.description, challenge.challengeId)
    handleCloseModal()
  }

  return (
    <Modal show={show} onClose={handleCloseModal}>
      <form onSubmit={handleSubmit(handleSaveChallenge)}>
        <ModalTitle>Edit challenge</ModalTitle>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium pb-2">
                Title
              </label>
              <input type="text" {...register("title", { required: true })} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-daonative-component-bg border-transparent text-daonative-gray-300" />
              {errors.title && (
                <span className="text-xs text-red-400">You need to set a title</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium pb-2">
                Description
              </label>
              <textarea rows="8" {...register("description", { required: true })} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-daonative-component-bg border-transparent text-daonative-gray-300" />
            </div>
          </div>
        </ModalBody>
        <ModalActionFooter>
          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="w-4 h-4 mx-auto"><Spinner /></span>
            ) : (
              <>Edit Challenge</>
            )}
          </PrimaryButton>
        </ModalActionFooter>
      </form>
    </Modal>
  )
}

const ExportSubmissionsCSV = ({ submissions }) => {
  const [csvUri, setCsvUri] = useState()

  useEffect(() => {
    const CSV = submissions ? submissions
      .map(submission => {
        const author = submission?.author
        const created = submission?.created?.toDate()
        const description = submission?.description
        const image = submission?.imageUrls?.length > 0 ? submission.imageUrls[0] : ""
        return `"${author}","${created}","${description}","${image}"`
      })
      .join('\n') : ""
    const URI = encodeURI(`data:text/csv;charset=utf-8,${CSV}`)
    setCsvUri(URI)
  }, [submissions])

  return (
    <a href={csvUri} download>
      <PrimaryButton>Export to CSV</PrimaryButton>
    </a>
  )
}

const ChallengeDetails = () => {
  const [showProofModal, setShowProofModal] = useState(false)
  const [showEditChallengeModal, setShowEditChallengeModal] = useState(false)
  const db = getFirestore()
  const { query: params } = useRouter()
  const challengeId = params.challengeId || ''
  const roomId = params.daoId || ''
  const [challenge] = useDocumentData(
    doc(db, 'challenges', challengeId || 'null')
  )
  const [submissionsSnapshot] = useCollection(
    query(collection(db, 'workproofs'), where('challengeId', '==', challengeId), orderBy('created', 'desc'))
  )
  const submissions = submissionsSnapshot?.docs.map(doc => ({ ...doc.data(), workproofId: doc.id }))

  const { account } = useWallet()
  const membership = useMembership(account, roomId)
  const isMember = !!membership
  const isAdmin = membership?.roles?.includes('admin')
  const isEnabled = challenge?.status !== "closed"

  const hasWorkToVerify = submissions && submissions?.length > 0

  const handleOpenProofModal = () => setShowProofModal(true)
  const handleCloseProofModal = () => setShowProofModal(false)

  const handleOpenEditChallengeModal = () => setShowEditChallengeModal(true)
  const handleCloseEditChallengeModal = () => setShowEditChallengeModal(false)

  return (
    <LayoutWrapper>
      <EditChallengeModal show={showEditChallengeModal} onClose={handleCloseEditChallengeModal} challenge={{ ...challenge, challengeId }} />
      <SubmitProofOfWorkModal show={showProofModal} onClose={handleCloseProofModal} challenge={{ ...challenge, challengeId }} />
      <div className="mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex">
          <div className="flex justify-center w-full max-w-2xl mx-auto">
            <h1 className="text-2xl">{challenge?.title}</h1>
          </div>
          {isAdmin && <SecondaryButton onClick={handleOpenEditChallengeModal}>Edit</SecondaryButton>}
        </div>
        <div className="flex flex-col w-full pt-16 gap-4 max-w-2xl mx-auto">
          <div className="w-full">
            <div className="whitespace-pre-wrap text-daonative-text">
              <Linkify options={{ className: 'text-daonative-primary-purple underline' }}>
                {challenge?.description}
              </Linkify>
            </div>
          </div>
          <div className="w-full">
            <div className="flex justify-between py-4">
              <div>
                <h2 className="text-xl text-daonative-white">Submissions</h2>
              </div>
              <div className="flex gap-4 items-center">
                {isAdmin && <ExportSubmissionsCSV submissions={submissions} />}
                {isAdmin && hasWorkToVerify && (
                  <Link href={`/dao/${roomId}/challenges/${challengeId}/verify`} passHref>
                    <a>
                      <PrimaryButton>Verify work</PrimaryButton>
                    </a>
                  </Link>
                )}
                {isMember && isEnabled && (
                  <button className="bg-daonative-primary-blue flex justify-center items-center rounded-full h-8 w-8 p-0" onClick={handleOpenProofModal}>
                    <PlusIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <SubmissionsList submissions={submissions} isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default ChallengeDetails