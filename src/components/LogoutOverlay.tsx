"use client";

import { motion, AnimatePresence } from "framer-motion";

export function LogoutOverlay({ isLoggingOut }: { isLoggingOut: boolean }) {
  return (
    <AnimatePresence>
      {isLoggingOut && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center space-y-4">
            <motion.div
              className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.p
              className="text-xl font-semibold"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Logging out...
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
