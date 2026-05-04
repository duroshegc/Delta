export const getApiErrorMessage = (err: unknown, fallback = 'Something went wrong') => {
  if (err && typeof err === 'object') {
    const anyErr = err as {
      response?: { data?: { message?: string; error?: string; details?: string } };
      message?: string;
    };
    return (
      anyErr.response?.data?.message ||
      anyErr.response?.data?.details ||
      anyErr.response?.data?.error ||
      anyErr.message ||
      fallback
    );
  }

  return fallback;
};
