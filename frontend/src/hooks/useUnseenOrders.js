// src/hooks/useUnseenOrders.js
import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api";

export default function useUnseenOrders({
  poll = false,
  interval = 30000,
} = {}) {
  const [count, setCount] = useState(0);
  const timer = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await api.get("/orders/unseen-count");
      setCount(data?.count || 0);
    } catch {
      console.error("Error fetching unseen order count");
    }
  }, []);

  const markSeen = useCallback(async () => {
    try {
      await api.put("/orders/mark-seen");
      setCount(0);
    } catch {
      console.error("Error marking orders as seen");
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
