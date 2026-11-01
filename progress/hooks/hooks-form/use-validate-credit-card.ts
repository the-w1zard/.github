import { Visa, MasterCard, AmericanExpress, Discover, Jcb, CreditCard, Amazon, Bitcoin, Cb, Cirrus, Delta, Klarna, Maestro, Paypal, Solo, Switch, WesternUnion } from '@a5gard/baldr'
import { useState } from '#sauron'

export function useValidateCreditCard(setValue, handleInputChange = false) {
    const [type, setType] = useState<string | null>(null)
    const [validCC, setValidCC] = useState<boolean | null>(null)

    const getCardNumberProps = () => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (handleInputChange === false) {
                setValue(e.target.value)
            } else if (handleInputChange === true) {
                setValue(e)
            }

            const value = e.target.value.replace(/\s+/g, '').replace(/[^\d]/g, '')

            // Determine card type based on prefixes
            let cardType = null
            if (/^4/.test(value)) {
                cardType = 'visa'
            } else if (/^5[1-5]/.test(value)) {
                cardType = 'mastercard'
            } else if (/^3[47]/.test(value)) {
                cardType = 'amex'
            } else if (/^6(?:011|5)/.test(value)) {
                cardType = 'discover'
            } else if (/^3(?:0[0-5]|[68])/.test(value)) {
                cardType = 'diners'
            } else if (/^(?:2131|1800|35)/.test(value)) {
                cardType = 'jcb'
            }
            setType(cardType)

            // Validate card number using Luhn algorithm
            if (value.length >= 13) {
                const isValid = luhnCheck(value)
                setValidCC(isValid)
            } else {
                setValidCC(null)
            }
        }

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            // Format with spaces as user types
            const input = e.target as HTMLInputElement
            const value = input.value.replace(/\s+/g, '')

            if (e.key === 'Backspace') return

            if (value.length > 0 && (value.length === 4 || value.length === 8 || value.length === 12)) {
                input.value = value.match(/.{1,4}/g)?.join(' ') || value
            }
        }

        return {
            onChange: handleChange,
            onKeyDown: handleKeyDown,
            placeholder: '1234 5678 9012 3456',
            maxLength: 19, // 16 digits + 3 spaces
            type: 'tel',
            inputMode: 'numeric',
            autoComplete: 'cc-number'
        }
    }

    const luhnCheck = (cardNumber: string): boolean => {
        let sum = 0
        let shouldDouble = false

        // Loop through values starting from the rightmost digit
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i))

            if (shouldDouble) {
                digit *= 2
                if (digit > 9) {
                    digit -= 9
                }
            }

            sum += digit
            shouldDouble = !shouldDouble
        }

        return sum % 10 === 0
    }

    const getCardIcon = () => {
        switch (type) {
            case 'visa': return Visa
            case 'mastercard': return MasterCard
            case 'amex': return AmericanExpress
            case 'discover': return Discover
            case 'diners': return CreditCard
            case 'amazon': return Amazon
            case 'Bitcoin': return Bitcoin
            case 'Cb': return Cb
            case 'Cirrus': return Cirrus
            case 'Delta': return Delta
            case 'Klarna': return Klarna
            case 'Maestro': return Maestro
            case 'Paypal': return Paypal
            case 'Solo': return Solo
            case 'Switch': return Switch
            case 'WesternUnion': return WesternUnion
            case 'jcb': return Jcb
            default: return CreditCard
        }
    }

    return {
        getCardNumberProps,
        type,
        validCC,
        getCardIcon
    }
}
