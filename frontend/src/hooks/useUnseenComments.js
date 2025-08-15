// src/hooks/useUnseenComments.js
import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api";

export default function useUnseenComments({
  poll = false,
  interval = 30000,
} = {}) {
  const [count, setCount] = useState(0);
  const timer = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      // onaysız + görülmemiş yorumlar
      const { data } = await api.get("/comments?approved=false&seen=false");
      setCount(Array.isArray(data) ? data.length : 0);
    } catch {
      console.error("Error fetching unseen comment count");
    }
  }, []);

  const markSeen = useCallback(async () => {
    try {
      await api.patch("/comments/mark-seen?approved=false");
      setCount(0);
    } catch {
      console.error("Error marking comments as seen");
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
