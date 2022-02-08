import {
  ArrowSmDownIcon,
  ArrowSmUpIcon,
  AdjustmentsIcon,
  ChartBarIcon,
  BeakerIcon
} from '@heroicons/react/solid';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { classNames } from "../lib/utils";
import { Modal, ModalActionFooter, ModalBody, ModalTitle } from './Modal';

const kpiDefaults = {
  0: { icon: ChartBarIcon },
  1: { icon: AdjustmentsIcon },
  2: { icon: BeakerIcon }
}

const MetricModal = ({ show, onClose, onSave, defaultValues }) => {
  const { register, handleSubmit } = useForm({defaultValues})

  const updateMetric = (data) => {
    onSave(data)
    onClose()
  }

  return (
    <Modal show={show} onClose={onClose}>
      <form onSubmit={handleSubmit(updateMetric)}>
        <ModalTitle>Set your KPI</ModalTitle>
        <ModalBody>
          <label htmlFor="name" className="block text-sm font-medium pb-2">
            KPI Name
          </label>
          <input type="text" {...register("name")} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-daonative-dark-100 dark:border-transparent dark:text-daonative-gray-300" />
          <label htmlFor="name" className="block text-sm font-medium pb-2 pt-4">
            What{"'"}s the latest indicator?
          </label>
          <input type="text" {...register("indicator")} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-daonative-dark-100 dark:border-transparent dark:text-daonative-gray-300" />
        </ModalBody>
        <ModalActionFooter>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-daonative-dark-100 dark:text-daonative-gray-100"
          >
            Set KPI
          </button>
        </ModalActionFooter>
      </form>
    </Modal>
  )
}

const Metric = ({ icon: MetricIcon, name, indicator, change, changeType, onSave }) => {
  const [showModal, setShowModal] = useState(false)

  const handleCloseMetricModal = () => {
    setShowModal(false)
  }

  const handleOpenMetricModal = () => {
    setShowModal(true)
  }

  const handleUpdateMetric = (data) => {
    onSave(data)
    setShowModal(true)
  }

  return (
    <div
      className="relative bg-white pt-5 px-4 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden dark:bg-daonative-dark-100 hover:cursor-pointer"
      onClick={handleOpenMetricModal}
    >
      <MetricModal show={showModal} onClose={handleCloseMetricModal} onSave={handleUpdateMetric} defaultValues={{name, indicator}} />
      <dt>
        <div className="absolute bg-blue-100 rounded-full p-3">
          <MetricIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
        </div>
        <p className="ml-16 text-sm font-medium text-gray-500 truncate dark:text-daonative-gray-300">{name || "Click to set KPI"}</p>
      </dt>
      <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
        <p className="text-2xl font-semibold text-gray-900 dark:text-daonative-gray-200">{indicator || "n/a"}</p>
        {change && (
          <p
            className={classNames(
              changeType === 'increase' ? 'text-green-600' : 'text-red-600',
              'ml-2 flex items-baseline text-sm font-semibold'
            )}
          >
            {changeType === 'increase' ? (
              <ArrowSmUpIcon className="self-center flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
            ) : (
              <ArrowSmDownIcon className="self-center flex-shrink-0 h-5 w-5 text-red-500" aria-hidden="true" />
            )}

            <span className="sr-only">{changeType === 'increase' ? 'Increased' : 'Decreased'} by</span>
            {change}
          </p>
        )}
      </dd>
    </div>
  )
}

const KPIs = ({ kpis: initialKPIs, roomId }) => {
  const [kpis, setKPIs] = useState(initialKPIs)

  // merge the KPI values with the default KPI values
  const metrics = Object.keys(kpiDefaults).sort().reduce(
    (obj, idx) => {
      return {
        [idx]: { ...kpiDefaults[idx], ...kpis[idx] },
        ...obj
      }
    },
    {}
  )

  const handleUpdateMetric = async (metricId, data) => {
    const newMetric = { [metricId]: { ...kpis[metricId], ...data } }
    const newMetrics = { ...kpis, ...newMetric }
    setKPIs(newMetrics)

    const db = getFirestore()
    const roomRef = doc(db, 'rooms', roomId)
    await updateDoc(roomRef, { kpis: newMetrics })
  }

  return (
    <div>
      <dl className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        {Object.keys(kpiDefaults).sort().map(metricId => {
          return (
            <Metric
              key={metricId}
              {...(metrics[metricId] || {})}
              onSave={(data) => handleUpdateMetric(metricId, data)}
            />
          )
        })}
      </dl>
    </div>
  );
};

export default KPIs