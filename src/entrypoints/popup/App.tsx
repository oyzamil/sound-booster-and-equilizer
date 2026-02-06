import { BarsIcon, ChatIcon, KeyIcon, SettingsIcon, StarIcon } from '@/icons';
import { ThemeProvider, useAntd } from '@/providers/ThemeProvider';
import { Dropdown, Space } from 'antd';
import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom';
import Home from './components/Home';

const { ROUTES } = useAppConfig();

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path={ROUTES.HOME}
            element={
              <Body>
                <Home />
              </Body>
            }
          />
          {/* Catch all route */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </Router>
      <LicenseModal />
    </ThemeProvider>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="h-full flex-1 overflow-y-auto p-2">{children}</main>
      <LicenseModal />
    </>
  );
}

export function Header() {
  const { settings, saveSettings } = useSettings();

  const { message } = useAntd();

  const items = [
    {
      key: 'activation',
      label: settings.licenseInfo.isLicensed ? i18n.t('activated') : i18n.t('activate'),
      icon: settings.licenseInfo.isLicensed ? (
        <StarIcon className="mr-2 size-4" />
      ) : (
        <KeyIcon className="mr-2 size-4" />
      ),
      onClick: async () => {
        settings.licenseInfo.isLicensed
          ? message.success(i18n.t('alreadySubscribedMsg'))
          : saveSettings({
              licenseModalVisible: true,
            });
      },
    },
    {
      key: 'support',
      label: i18n.t('support'),
      onClick: () => {
        sendMessage(GENERAL_MESSAGES.OPEN_TAB, { url: 'https://www.linkedin.com/in/oyzamil/' });
      },
      icon: <ChatIcon className="mr-2 size-4" />,
    },
    {
      key: 'settings',
      label: i18n.t('settings'),
      onClick: () => {
        browser.runtime.openOptionsPage();
      },
      icon: <SettingsIcon className="mr-2 size-4" />,
    },
  ];

  return (
    <>
      <header className={'bg-app-500 z-51 flex w-full items-center px-2 py-3 dark:bg-black'}>
        <Watermark className="w-full text-xl" />
        <div className="flex items-center justify-center gap-1">
          <Space.Compact block>
            <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
              <Button className="px-1" variant="text">
                <BarsIcon className="size-5 text-white" />
              </Button>
            </Dropdown>
          </Space.Compact>
        </div>
      </header>
    </>
  );
}
