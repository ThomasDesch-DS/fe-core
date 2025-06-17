import type { FormData } from '../types';
import { stepStore } from '../store/formStore';

const BASE_URL = 'http://localhost:8080/escort';

/**
 * Validate email and send verification code
 */
export async function validateEmail(email: string): Promise<boolean> {
    try {
        const response = await fetch(`${BASE_URL}/validate/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            return true;
        } else if (response.status === 409) {
            // Skip validation and continue to next step
            stepStore.set(6); // Skip to age step
            return true;
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Error validando email');
        }
    } catch (error) {
        console.error('Email validation error:', error);
        throw error;
    }
}

/**
 * Verify email code
 */
export async function verifyEmailCode(email: string, code: string): Promise<boolean> {
    try {
        const response = await fetch(`${BASE_URL}/validate/code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });
        

        
        if (response.ok) {
            return true;
        } else if (response.status === 409) {
            // Skip validation and continue to next step
            return true;
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Código inválido');
        }
    } catch (error) {
        console.error('Code verification error:', error);
        throw error;
    }
}

/**
 * Submit the form data to register a new escort
 */
export async function submitRegistration(formData: FormData) {
    const payload = {
        email: formData.email,
        password: formData.password,
        privatePhoneNumber: formData.privatePhoneNumber,
        publicPhoneNumber: formData.publicPhoneNumber,
        basicInfo: {
            name: formData.name, 
            surname: formData.surname, 
            displayName: formData.displayName, 
            age: parseInt(formData.age), 
            documentation: formData.documentation
        },
        appearance: {
            heightInCm: parseInt(formData.heightInCm),
            weightInKg: parseInt(formData.weightInKg),
            breastSize: formData.breastSize,
            buttSize: formData.buttSize,
            eyeColor: formData.eyeColor,
            hairColor: formData.hairColor,
            ethnicity: formData.ethnicity,
            nationality: formData.nationality,
            skinColor: formData.skinColor,
            gender: formData.gender,
            waxingLevel: formData.waxingLevel,
            bust: parseInt(formData.bust),
            waist: parseInt(formData.waist),
            hips: parseInt(formData.hips),
            penisSize: formData.penisSize || null
        },
        media: {
            profilePicture: formData.profilePicBase64,
            pics: formData.pics.map(p => ({ media: p.base64, order: p.order })),
            videos: formData.videos.map(v => ({ media: v.base64, order: v.order })),
            audioCLip: formData.audioClipBase64 || null,
            kyc: [formData.kycIdPhoto, formData.kycIdFront, formData.kycIdBack]
        },
        servicesInfo: {
            description: formData.description,
            services: {
                basic: Array.from(formData.selectedServices),
                extras: [],
                massage: Array.from(formData.selectedMassages),
                oral: [],
                fantasy: Array.from(formData.selectedFantasies),
                virtual: Array.from(formData.selectedVirtual)
            },
            hourPrice: { 
                amount: parseInt(formData.hourPriceAmount), 
                currency: formData.hourPriceCurrency 
            },
            customRates: formData.customRates.map(r => ({
                serviceName: r.serviceName,
                duration: r.duration,
                incallPrice: parseFloat(r.incallPrice),
                outcallPrice: parseFloat(r.outcallPrice)
            }))
        },
        availability: Object.entries(formData.daySlots).map(([day, slots]) => {
            // Filter out empty slots
            const validSlots = slots.filter(slot => slot.start.trim() && slot.end.trim());
            if (validSlots.length === 0) return null;
            
            return {
                day,
                slots: validSlots.map(slot => ({
                    startHourWithMinutes: slot.start.trim(),
                    endHourWithMinutes: slot.end.trim()
                }))
            };
        }).filter(Boolean),
        contactMethods: formData.contactMethods.map(cm => ({ 
            value: cm.value, 
            type: cm.type 
        })),
        location: { 
            country: formData.country, 
            state: formData.state, 
            city: formData.city, 
            hood: formData.hood 
        }
    };
    
    try {
        const res = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (res.ok) {
            // Don't redirect - let the component handle the success state
            return true;
        } else {
            // Handle specific error codes
            if (data.errorCode) {
                switch (data.errorCode) {
                    case 'EmailAlreadyExistsException':
                        throw new Error('Este email ya está registrado. Intenta con otro.');
                    case 'ValidationException':
                        throw new Error(data.message ?? 'Error de validación. Revisá los datos.');
                    default:
                        throw new Error(data.message ?? 'Error al registrar. Intentá nuevamente.');
                }
            } else {
                throw new Error('Error al registrar. Intentá nuevamente.');
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}