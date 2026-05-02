import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export const PageShell = ({ children }: { children: ReactNode }) => (
  <motion.main
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    className="pb-24"
  >
    {children}
  </motion.main>
);
