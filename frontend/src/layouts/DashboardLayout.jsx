import React, { useState, Fragment, useEffect } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition, Menu } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  HomeIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  VideoCameraIcon,
  CreditCardIcon,
  UsersIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  MagnifyingGlassCircleIcon,
  BuildingOffice2Icon,
  ShieldExclamationIcon,
  BeakerIcon,
  GiftIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import ThemeSwitcher from '../components/layout/ThemeSwitcher';
import LanguageSwitcher from '../components/layout/LanguageSwitcher';
import useFCM from '../hooks/useFCM';
import Feature from '../components/common/Feature';

const navigationConfig = {
    patient: [
        { name: 'Dashboard', to: '/patient', icon: HomeIcon, end: true },
        { name: 'Medical Records', to: '/patient/records', icon: DocumentTextIcon },
        { name: 'Appointments', to: '/patient/appointments', icon: CalendarDaysIcon },
        { name: 'Find a Doctor', to: '/patient/find-doctor', icon: MagnifyingGlassCircleIcon, feature: 'GEOSPATIAL_SEARCH' },
        { name: 'Hospitals', to: '/patient/hospitals', icon: BuildingOffice2Icon },
        { name: 'Consultations', to: '/consultation/placeholder', icon: VideoCameraIcon, feature: 'TELEMEDICINE' },
        { name: 'Drug Interactions', to: '/patient/drug-interactions', icon: BeakerIcon },
        { name: 'Medical Tips', to: '/patient/medical-tips', icon: GiftIcon },
        { name: 'My Vitals', to: '/patient/vitals', icon: DocumentChartBarIcon },
        { name: 'My Wellness', to: '/patient/wellness', icon: HeartIcon },
        { name: 'Financials', to: '/patient/financials', icon: CurrencyDollarIcon },
        { name: 'Subscription', to: '/subscriptions', icon: CreditCardIcon },
    ],
    physician: [
        { name: 'Dashboard', to: '/physician', icon: HomeIcon, end: true },
        { name: 'My Schedule', to: '/physician/schedule', icon: CalendarDaysIcon },
        { name: 'My Patients', to: '/physician/patients', icon: UsersIcon },
        { name: 'AI Diagnosis', to: '/physician/ai-diagnosis', icon: LightBulbIcon, feature: 'AI_DIAGNOSIS' },
        { name: 'Consultations', to: '/consultation/placeholder', icon: VideoCameraIcon, feature: 'TELEMEDICINE' },
        { name: 'Communication Hub', to: '/physician/messages', icon: ChatBubbleLeftRightIcon }, // New Icon
        { name: 'Development', to: '/physician/development', icon: AcademicCapIcon }, // New Icon
    ],
    superuser: [
        { name: 'Dashboard', to: '/admin', icon: HomeIcon, end: true },
        { name: 'User Management', to: '/admin/users', icon: UsersIcon },
        { name: 'Physician Verification', to: '/admin/verify', icon: ShieldCheckIcon },
        { name: 'Feature Flags', to: '/admin/feature-flags', icon: Cog6ToothIcon },
        { name: 'Audit Trail', to: '/admin/audit-trail', icon: ShieldExclamationIcon },
        { name: 'Subscriptions', to: '/admin/subscriptions', icon: CreditCardIcon },
    ],
};

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  return (
    <Menu as="div" className="relative">
      <div>
        <Menu.Button className="flex max-w-xs items-center rounded-full bg-gray-200 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-dortmed-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
          <span className="sr-only">Open user menu</span>
          <UserCircleIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">Signed in as</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.email}
            </p>
          </div>
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to={`/${user?.role}/settings`}
                  className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                >
                  <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Settings
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={logout}
                  className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                >
                  <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Logout
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const SidebarContent = ({ role }) => {
  const { t } = useTranslation();
  const navigation = navigationConfig[role] || [];
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-dortmed-800 dark:bg-gray-900 px-6 pb-4">
      <Link to="/" className="flex h-16 shrink-0 items-center space-x-3">
        <img src="/header.png" alt="DoltMed Logo" className="h-14 w-auto" />
      </Link>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const NavItem = (
                  <li key={item.name}>
                    <NavLink
                      to={item.to}
                      end={item.end || false}
                      className={({ isActive }) =>
                        `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-150
                         ${isActive ? 'bg-dortmed-900 text-white' : 'text-dortmed-200 hover:text-white hover:bg-dortmed-700'}`
                      }
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {t(`nav.${item.name.toLowerCase().replace(/ /g, '_')}`)}
                    </NavLink>
                  </li>
                );
                if (item.feature) {
                  return (
                    <Feature name={item.feature} key={item.name}>
                      {NavItem}
                    </Feature>
                  );
                }
                return NavItem;
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
};

const DashboardLayout = ({ role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  useFCM();
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900/50">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>
          <div className="fixed inset-0 flex">
            <Transition.Child as={Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent role={role} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent role={role} />
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button type="button" className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="h-6 w-px bg-gray-900/10 dark:bg-white/5 lg:hidden" aria-hidden="true" />
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <LanguageSwitcher />
              <ThemeSwitcher />
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10 dark:lg:bg-white/5" aria-hidden="true" />
              <UserMenu />
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;