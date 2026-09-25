function timedCache(ttlMs) {
  let state = { value: null, expiresAt: 0, pending: null };

  return {
    invalidate() {
      state = { value: null, expiresAt: 0, pending: null };
    },
    get(load) {
      const current = state;
      if (current.value !== null && Date.now() < current.expiresAt) {
        return Promise.resolve(current.value);
      }
      if (!current.pending) {
        current.pending = Promise.resolve()
          .then(load)
          .then((value) => {
            if (state === current) {
              current.value = value;
              current.expiresAt = Date.now() + ttlMs;
            }
            return value;
          })
          .finally(() => { current.pending = null; });
      }
      return current.pending;
    },
  };
}

module.exports = { timedCache };
