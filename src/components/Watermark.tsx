import logo from '@/assets/icon.svg';

interface Watermark {
  className: string;
  logoClassName?: string;
  taglineClassName?: string;
  tagline?: string;
}

const Watermark = ({
  className = '',
  logoClassName,
  taglineClassName,
  tagline = '',
}: Watermark) => {
  const borderColor = 'dark:text-white text-white';
  return (
    <div
      className={cn('dark:text-app-500 flex gap-2 text-[14px] text-white select-none!', className)}
    >
      <div className="-my-1 inline-grid grid-cols-[.25rem_1fr_.25rem] grid-rows-[.25rem_1fr_.25rem] align-middle">
        <div
          className={cn('animate-spark border-s border-t [grid-area:1/1/2/2]', borderColor)}
        ></div>
        <div
          className={cn('animate-spark-fast border-e border-t [grid-area:1/3/2/4]', borderColor)}
        ></div>
        <div
          className={cn('animate-spark-fast border-s border-b [grid-area:3/1/4/2]', borderColor)}
        ></div>
        <div
          className={cn('animate-spark border-e border-b [grid-area:3/3/4/4]', borderColor)}
        ></div>
        <div className={cn('flex-center m-0.5 tracking-wide [grid-area:1/1/4/4]')}>
          <Logo className={logoClassName} />
        </div>
      </div>
      <div className="flex-col">
        <span className="block font-semibold">{i18n.t('appShortName')}</span>
        {tagline && (
          <span
            className={cn(
              'block max-w-70 truncate text-[12px] leading-tight dark:text-gray-500',
              taglineClassName
            )}
            title={tagline ? tagline : i18n.t('appName')}
          >
            {tagline ? tagline : i18n.t('appName')}
          </span>
        )}
      </div>
    </div>
  );
};

export default Watermark;

export const Logo = ({
  rootClassName,
  className,
  children,
}: {
  rootClassName?: string;
  className?: string;
  children?: string | React.ReactNode;
}) => {
  return (
    <span
      className={cn(
        'flex-center bg-app-800 dark:bg-app-800/30 min-h-10 w-auto min-w-10 rounded-md p-0',
        rootClassName
      )}
    >
      <img className={cn('size-8', className)} src={logo} />
      {children}
    </span>
  );
};
