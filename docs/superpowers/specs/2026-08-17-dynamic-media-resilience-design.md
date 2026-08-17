# Dynamic Media Resilience Design

## Goal

Published dynamics remain readable when an attached image, audio, video, or other file cannot be retrieved. The public page and admin preview show a clear unavailable state for only that item.

## Evidence and scope

- The Django dynamic serializers currently return attached `UploadFile` records as media objects, while legacy records retain string URLs in `media_urls`. The public list renders an object as an image `src`, producing an invalid URL.
- The public detail renders only video attachments. Admin preview renders three media types but has no load-error state.
- `UploadFile` uses stable `/api/upload/public/<id>/` URLs. A missing storage object deliberately returns JSON 404; an unavailable backend returns 503. Nginx's `/media/` location is only for legacy local URLs and is not the file-delivery path.

## Design

The backend returns one normalized `mediaUrls` collection for both public and management dynamic reads. Each item is an object with URL, type, name, size, and optional poster URL. Attached records are the source of truth; legacy `media_urls` values are retained as normalized URL items when no attachment exists.

The Vue clients normalize the same shape once per view. Image, audio, video, and generic files use their proper HTML element or link. On an element `error`, only that item's view becomes an accessible unavailable card. The containing dynamic and all sibling media stay visible. No binary placeholder response, storage cache, database migration, or new dependency is added.

## Verification

- Django tests prove list and detail responses preserve attached and legacy media in the normalized shape.
- Vue tests prove each renderer receives a usable URL and changes to an unavailable state after a media error.
- Full backend and frontend test/build gates run before deployment.
- Production verification checks a published dynamic API response, a valid public upload URL, a deliberately absent public upload URL returning 404, and service/Nginx health.
