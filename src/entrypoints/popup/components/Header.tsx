import { BarsIcon, ChatIcon } from '@/icons';
import { useAntd } from '@/providers/ThemeProvider';
import { Dropdown, Space } from 'antd';
import { useAppSelector } from '../store/hooks';

const Header = () => {
  const { settings, saveSettings } = useSettings();
  const { message } = useAntd();
  const tab = useAppSelector((state: any) => state.ui.tab);

  const items = [
    {
      key: 'support',
      label: i18n.t('support'),
      onClick: () => {
        browser.tabs.create({ url: 'https://muzammil.work' });
      },
      icon: <ChatIcon className="mr-2 size-4" />,
    },
  ];

  return (
    <header
      className={
        'bg-app-500 border-theme z-51 flex w-full items-center border-b px-2 py-3 dark:bg-black'
      }
    >
      <Watermark className="w-full text-xl" tagline={tab.title || 'Equalizer for Browser'} />
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
  );
};

export default Header;
