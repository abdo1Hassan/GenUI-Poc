"use client";

import { useEffect, useState } from "react";
import styles from "./Toaster.module.css";

interface ToasterProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

export default function Toaster({ message, visible, onClose }: ToasterProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000); // Auto-close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <div
      className={`${styles.toaster} ${visible ? styles.visible : styles.hidden}`}
    >
      {message}
    </div>
  );
}
