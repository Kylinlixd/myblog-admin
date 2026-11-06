import { t } from '@/i18n'

export function unwrapApiResponse(response, errorMessage = t('common.requestFailed')) {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    return response
  }

  if (response.code !== undefined && response.code !== 200) {
    throw new Error(typeof response.message === 'string' ? response.message : errorMessage)
  }

  return Object.prototype.hasOwnProperty.call(response, 'data')
    ? response.data
    : response
}
