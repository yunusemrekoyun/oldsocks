// src/hooks/useUnseenReplies.js
import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api";

export default function useUnseenReplies({
  poll = false,
  interval = 30000,
} = {}) {
  const [count, setCount] = useState(0);
  const timer = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      // onaysız + görülmemiş yanıtlar
      const { data } = await api.get("/replies?approved=false&seen=false");
      setCount(Array.isArray(data) ? data.length : 0);
    } catch {
      console.error("Error fetching unseen reply count");
    }
  }, []);

  const markSeen = useCallback(async () => {
    try {
      await api.patch("/replies/mark-seen?approved=false");
      setCount(0);
    } catch {
      console.error("Error marking replies as seen");
    }
  }, []);

  useEffect(() => {
    fetchCount();
    if (poll) {
      timer.current = setInterval(fetchCount, interval);
      return () => clearInterval(timer.current);
    }
  }, [fetchCount, poll, interval]);

  return { count, fetchCount, markSeen, setCount };
}
