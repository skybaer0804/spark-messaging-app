/**
 * 어떤 형식이든 안전하게 timestamp 숫자를 반환합니다.
 * 에러 발생 시 0을 반환하여 앱 크래시를 방지합니다.
 */
export const getSafeTime = (date: Date | string | number | undefined | null): number => {
  if (!date) return 0;
  const d = new Date(date);
  const time = d.getTime();
  return isNaN(time) ? 0 : time;
};

/**
 * 어떤 형식이든 안전하게 Date 객체를 반환합니다.
 * 유효하지 않은 형식일 경우 기본값(Epoch 0)을 반환합니다.
 */
export const getSafeDate = (date: Date | string | number | undefined | null): Date => {
  if (!date) return new Date(0);
  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

/**
 * 객체의 깊은 경로에 안전하게 접근하고 기본값을 반환합니다.
 * 옵셔널 체이닝을 보완하는 유틸리티입니다.
 */
export const getSafeValue = <T, K>(obj: T, selector: (o: T) => K, defaultValue: K): K => {
  try {
    const value = selector(obj);
    return (value === undefined || value === null) ? defaultValue : value;
  } catch {
    return defaultValue;
  }
};

/**
 * 두 값이 날짜/시간 관점에서 동일한지 비교합니다. (문자열/객체 혼용 대응)
 */
export const areDatesEqual = (
  date1: Date | string | number | undefined | null,
  date2: Date | string | number | undefined | null
): boolean => {
  return getSafeTime(date1) === getSafeTime(date2);
};
