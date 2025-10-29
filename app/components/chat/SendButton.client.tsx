import { cubicBezier, motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import styles from './BaseChat.module.scss';

interface SendButtonProps {
  isStreaming?: boolean;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  className?: string;
}

const customEasingFn = cubicBezier(0.4, 0, 0.2, 1);

export const SendButton = ({ isStreaming, disabled, onClick, className }: SendButtonProps) => {
  return (
    <motion.button
      className={classNames(
        'flex justify-center items-center p-1 rounded-md transition-theme disabled:opacity-50 disabled:cursor-not-allowed',
        className,
        isStreaming ? '' : '',
      )}
      transition={{ ease: customEasingFn, duration: 0.17 }}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();

        if (!disabled) {
          onClick?.(event);
        }
      }}
    >
      <div className="text-lg flex items-center gap-x-1">
        {!isStreaming && <span>Create</span>}
        {!isStreaming ? <div className="i-ph:arrow-right" /> : <div className="i-ph:stop-circle-bold" />}
      </div>
    </motion.button>
  );
};
