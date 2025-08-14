import posthog from 'posthog-js';

function detectDevice(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) return 'android';
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/windows/.test(ua)) return 'windows';
    if (/mac os/.test(ua)) return 'macos';
    if (/linux/.test(ua)) return 'linux';
    return 'web';
}

function getSessionId(): string {
    let sid = sessionStorage.getItem('sessionId');
    if (!sid) {
        sid = crypto.randomUUID();
        sessionStorage.setItem('sessionId', sid);
    }
    return sid;
}

/**
 * Unified function to get userType and id from stores
 */
import { get } from 'svelte/store';
import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
import { escortAuthStore } from '$lib/escort/store/escortAuthStore';

export function getCurrentUserAnalytics() {
    const dsUser = get(dSuserAuthStore);
    if (dsUser?.isAuthenticated && dsUser?.username) {
        return { userType: 'DSUser', userId: dsUser.username };
    }
    const escort = get(escortAuthStore);
    if (escort?.isAuthenticated && escort?.user?.id) {
        return { userType: 'Escort', userId: escort.user.id };
    }
    return { userType: undefined, userId: undefined };
}

// Removed: PostHog is initialized in +layout.ts to avoid duplicate initialization

function enrichProps(props: Record<string, any> = {}) {
    const { userType, userId } = getCurrentUserAnalytics();
    return {
        ...props,
        userType,
        userId,
        timestamp: new Date().toISOString(),
        device: detectDevice(),
        sessionId: getSessionId(),
        url: window.location.pathname
    };
}

export function trackPageOpen(props: Record<string, any> = {}) {
    posthog.capture('pageOpen', enrichProps(props));
}
export function trackFaceSwap(props: Record<string, any> = {}) {
    posthog.capture('faceSwap', enrichProps(props));
}
export function trackFaceSwapResult(props: Record<string, any> = {}) {
    posthog.capture('faceSwapResult', enrichProps(props));
}

export function trackEscortContact(props: Record<string, any> = {}) {
    posthog.capture('escortContact', enrichProps(props));
}

export function trackEscortGallery(props: Record<string, any> = {}) {
    posthog.capture('escortGallery', enrichProps(props));
}

export function trackEscortCatlist(props: Record<string, any> = {}) {
    posthog.capture('escortCatlist', enrichProps(props));
}

export function trackEscortShare(props: Record<string, any> = {}) {
    posthog.capture('escortShare', enrichProps(props));
}

export function trackEscortAudio(props: Record<string, any> = {}) {
    posthog.capture('escortAudio', enrichProps(props));
}

export function trackEscortSearch(props: Record<string, any> = {}) {
    posthog.capture('escortSearch', enrichProps(props));
}

export function trackEscortSearchResultClick(props: Record<string, any> = {}) {
    posthog.capture('escortSearchResultClick', enrichProps(props));
}

// Catlist page tracking functions
export function trackCatlistAction(props: Record<string, any> = {}) {
    posthog.capture('catlistAction', enrichProps(props));
}

// Motel tracking functions
export function trackMotelPreviewsView(props: Record<string, any> = {}) {
    posthog.capture('motelPreviewsView', enrichProps(props));
}

export function trackMotelPreviewClick(props: Record<string, any> = {}) {
    posthog.capture('motelPreviewClick', enrichProps(props));
}

export function trackMotelDetailView(props: Record<string, any> = {}) {
    posthog.capture('motelDetailView', enrichProps(props));
}

export function trackEscortDetailView(props: Record<string, any> = {}) {
    posthog.capture('escortDetailView', enrichProps(props));
}

export function trackMotelContact(props: Record<string, any> = {}) {
    posthog.capture('motelContact', enrichProps(props));
}

export function trackMotelMapView(props: Record<string, any> = {}) {
    posthog.capture('motelMapView', enrichProps(props));
}

export function trackMotelImageGallery(props: Record<string, any> = {}) {
    posthog.capture('motelImageGallery', enrichProps(props));
}

export function trackMotelReviewsView(props: Record<string, any> = {}) {
    posthog.capture('motelReviewsView', enrichProps(props));
}

export function trackMotelReviewSubmit(props: Record<string, any> = {}) {
    posthog.capture('motelReviewSubmit', enrichProps(props));
}

export function trackFooterContactClick(props: Record<string, any> = {}) {
    posthog.capture('footerContactClick', enrichProps(props));
}

export function trackFooterTelegramClick(props: Record<string, any> = {}) {
    posthog.capture('footerTelegramClick', enrichProps(props));
}

export function trackUserLogin(props: Record<string, any> = {}) {
    posthog.capture('userLogin', enrichProps(props));
}

export function trackUserRegister(props: Record<string, any> = {}) {
    posthog.capture('userRegister', enrichProps(props));
}

export function trackUserForgotPassword(props: Record<string, any> = {}) {
    posthog.capture('userForgotPassword', enrichProps(props));
}

export function trackUserResetPassword(props: Record<string, any> = {}) {
    posthog.capture('userResetPassword', enrichProps(props));
}

export function trackRegisterStepPersonalInfo(props: Record<string, any> = {}) {
    posthog.capture('register_step_personal_info', enrichProps(props));
}

export function trackRegisterStepPersonalInfoName(props: Record<string, any> = {}) {
    posthog.capture('register_step_personal_info_name', enrichProps(props));
}

export function trackRegisterStepPersonalInfoSurname(props: Record<string, any> = {}) {
    posthog.capture('register_step_personal_info_surname', enrichProps(props));
}

export function trackRegisterStepPersonalInfoDisplayName(props: Record<string, any> = {}) {
    posthog.capture('register_step_personal_info_display_name', enrichProps(props));
}

export function trackRegisterStepPersonalInfoEmail(props: Record<string, any> = {}) {
    posthog.capture('register_step_personal_info_email', enrichProps(props));
}

export function trackRegisterStepPersonalInfoVerifyCode(props: Record<string, any> = {}) {
    posthog.capture('register_step_personal_info_verify_code', enrichProps(props));
}

export function trackRegisterStepPersonalInfoAge(props: Record<string, any> = {}) {
    posthog.capture('register_step_personal_info_age', enrichProps(props));
}

export function trackRegisterStepPersonalInfoGender(props: Record<string, any> = {}) {
    posthog.capture('register_step_personal_info_gender', enrichProps(props));
}

export function trackRegisterStepPersonalInfoPrivatePhone(props: Record<string, any> = {}) {
    posthog.capture('register_step_personal_info_private_phone', enrichProps(props));
}

export function trackRegisterStepPersonalInfoPublicPhone(props: Record<string, any> = {}) {
    posthog.capture('register_step_personal_info_public_phone', enrichProps(props));
}

export function trackRegisterStepPersonalInfoIdNumber(props: Record<string, any> = {}) {
    posthog.capture('register_step_personal_info_id_number', enrichProps(props));
}

export function trackRegisterStepPersonalInfoPassword(props: Record<string, any> = {}) {
    posthog.capture('register_step_personal_info_password', enrichProps(props));
}

export function trackRegisterStepPersonalInfoDocumentation(props: Record<string, any> = {}) {
    posthog.capture('register_step_personal_info_documentation', enrichProps(props));
}

export function trackPreRegisterPhone(props: Record<string, any> = {}) {
    posthog.capture('pre_register_phone', enrichProps(props));
}

export function trackPreRegisterEmail(props: Record<string, any> = {}) {
    posthog.capture('pre_register_email', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributes(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesHeight(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_height', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesWeight(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_weight', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesNationality(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_nationality', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesHairColor(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_hair_color', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesEyeColor(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_eye_color', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesSkinColor(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_skin_color', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesEthnicity(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_ethnicity', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesBust(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_bust', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesWaist(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_waist', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesHips(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_hips', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesButtSize(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_butt_size', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesBreastSize(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_breast_size', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesWaxingLevel(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_waxing_level', enrichProps(props));
}

export function trackRegisterStepPhysicalAttributesPenisSize(props: Record<string, any> = {}) {
    posthog.capture('register_step_physical_attributes_penis_size', enrichProps(props));
}

export function trackRegisterStepServicesInfo(props: Record<string, any> = {}) {
    posthog.capture('register_step_services_info', enrichProps(props));
}

export function trackRegisterStepServicesInfoServices(props: Record<string, any> = {}) {
    posthog.capture('register_step_services_info_services', enrichProps(props));
}

export function trackRegisterStepServicesInfoFantasies(props: Record<string, any> = {}) {
    posthog.capture('register_step_services_info_fantasies', enrichProps(props));
}

export function trackRegisterStepServicesInfoMassages(props: Record<string, any> = {}) {
    posthog.capture('register_step_services_info_massages', enrichProps(props));
}

export function trackRegisterStepServicesInfoVirtual(props: Record<string, any> = {}) {
    posthog.capture('register_step_services_info_virtual', enrichProps(props));
}

export function trackRegisterStepServicesInfoHourPrice(props: Record<string, any> = {}) {
    posthog.capture('register_step_services_info_hour_price', enrichProps(props));
}

export function trackRegisterStepServicesInfoCustomRates(props: Record<string, any> = {}) {
    posthog.capture('register_step_services_info_custom_rates', enrichProps(props));
}

export function trackRegisterStepServicesInfoGoToAvailability(props: Record<string, any> = {}) {
    posthog.capture('register_step_services_info_go_to_availability', enrichProps(props));
}

export function trackRegisterStepAvailability(props: Record<string, any> = {}) {
    posthog.capture('register_step_availability', enrichProps(props));
}

export function trackRegisterStepAvailabilityPrefs(props: Record<string, any> = {}) {
    posthog.capture('register_step_availability_prefs', enrichProps(props));
}

export function trackRegisterStepAvailabilitySchedule(props: Record<string, any> = {}) {
    posthog.capture('register_step_availability_schedule', enrichProps(props));
}

export function trackRegisterStepDescription(props: Record<string, any> = {}) {
    posthog.capture('register_step_description', enrichProps(props));
}

export function trackRegisterStepDescriptionDescription(props: Record<string, any> = {}) {
    posthog.capture('register_step_description_description', enrichProps(props));
}

export function trackRegisterStepDescriptionContactMethods(props: Record<string, any> = {}) {
    posthog.capture('register_step_description_contact_methods', enrichProps(props));
}

export function trackRegisterStepLocation(props: Record<string, any> = {}) {
    posthog.capture('register_step_location', enrichProps(props));
}

export function trackRegisterStepLocationLocation(props: Record<string, any> = {}) {
    posthog.capture('register_step_location_location', enrichProps(props));
}

export function trackRegisterStepMediaUpload(props: Record<string, any> = {}) {
    posthog.capture('register_step_media_upload', enrichProps(props));
}

export function trackRegisterStepMediaUploadProfilePic(props: Record<string, any> = {}) {
    posthog.capture('register_step_media_upload_profile_pic', enrichProps(props));
}

export function trackRegisterStepMediaUploadExtraPics(props: Record<string, any> = {}) {
    posthog.capture('register_step_media_upload_extra_pics', enrichProps(props));
}

export function trackRegisterStepMediaUploadVideos(props: Record<string, any> = {}) {
    posthog.capture('register_step_media_upload_videos', enrichProps(props));
}

export function trackRegisterStepMediaUploadAudio(props: Record<string, any> = {}) {
    posthog.capture('register_step_media_upload_audio', enrichProps(props));
}

export function trackRegisterStepMediaUploadKycIdPhoto(props: Record<string, any> = {}) {
    posthog.capture('register_step_media_upload_kyc_id_photo', enrichProps(props));
}

export function trackRegisterStepMediaUploadKycIdFront(props: Record<string, any> = {}) {
    posthog.capture('register_step_media_upload_kyc_id_front', enrichProps(props));
}

export function trackRegisterStepMediaUploadKycIdBack(props: Record<string, any> = {}) {
    posthog.capture('register_step_media_upload_kyc_id_back', enrichProps(props));
}

export function trackRegisterStepSubmit(props: Record<string, any> = {}) {
    posthog.capture('register_step_submit', enrichProps(props));
}

export function trackRegisterStepSubmitSubmit(props: Record<string, any> = {}) {
    posthog.capture('register_step_submit_submit', enrichProps(props));
}
