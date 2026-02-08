import { ChatIcon, StarIcon } from '@/icons';
import { X } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReviewModal = ({ isOpen, onClose }: ReviewModalProps) => {
  if (!isOpen) return null;

  const handleRateClick = () => {
    // Open Chrome Web Store review page
    const storeUrl = `https://browser.google.com/webstore/detail/${browser.runtime.id}/reviews`;
    browser.tabs.create({ url: storeUrl });
    onClose();
  };

  const handleFeedbackClick = () => {
    // Open feedback form or email
    // You can customize this URL
    const feedbackUrl = `https://browser.google.com/webstore/detail/${browser.runtime.id}/support`;
    browser.tabs.create({ url: feedbackUrl });
    onClose();
  };

  return (
    <div
      className="bg-opacity-70 fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-lg"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="w-112.5 rounded-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <h3 className="heading mb-0">Love our extension?</h3>
          <Button variant="text" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <p className="mb-6 px-7 text-center text-sm leading-relaxed text-gray-300">
          We're thrilled that you're enjoying this amazing tool! Your support means the world to us.
          Would you mind taking a moment to rate us 5 stars and share your feedback?
        </p>

        <div className="flex-col-center w-full gap-3">
          <Button
            className="w-full"
            variant="primary"
            onClick={handleRateClick}
            icon={<StarIcon className="h-5 w-5 fill-yellow-400" />}
          >
            Rate 5 Stars on Chrome Web Store
          </Button>

          <div className="flex w-full items-center justify-center gap-3">
            <Button onClick={handleFeedbackClick} icon={<ChatIcon className="h-5 w-5" />}>
              Leave Feedback
            </Button>
            <Button onClick={onClose} danger>
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
