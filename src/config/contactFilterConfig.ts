import { validateFilterDIC, validateFilterICO } from '../utils/filterUtils';
import { ContactFilterState, FilterConfig } from '../types/filter';

export const DIC_PREFIXES = ['CZ', 'SK', 'vlastní'];

/**
 * Filter configuration for Contacts table
 */
export const contactFilterConfig: FilterConfig = {
  filters: [
    // Global text search
    {
      id: 'search',
      type: 'text-search',
      label: 'Hledat',
      placeholder: 'Název, město, telefon, email...',
      searchFields: [
        'company_name',
        'representative_name',
        'city',
        'street',
        'postal_code',
        'phone',
        'email',
        'website',
      ],
      columnId: null, // Always visible
      width: 200, // Compact search field
    },

    // Supplier/Customer checkboxes (required group)
    {
      id: 'is_supplier',
      type: 'checkbox',
      label: 'Dodavatel',
      field: 'is_supplier',
      columnId: 'type',
      group: 'contact_type',
      required: false,
    },
    {
      id: 'is_customer',
      type: 'checkbox',
      label: 'Odběratel',
      field: 'is_customer',
      columnId: 'type',
      group: 'contact_type',
      required: false,
    },

    // ICO filter with validation
    {
      id: 'ico',
      type: 'number-input',
      label: 'IČO',
      field: 'ico',
      columnId: 'ico',
      placeholder: '12345678',
      maxLength: 8,
      autocomplete: true,
      validate: validateFilterICO,
      width: 110, // Just enough for 8 digits + label
    },

    // DIC filter with prefix selector
    {
      id: 'dic',
      type: 'number-with-prefix',
      label: 'DIČ',
      field: 'dic',
      columnId: 'dic',
      prefixes: DIC_PREFIXES,
      placeholder: '12345678',
      customPlaceholder: 'Zadejte DIČ...',
      autocomplete: true,
      validate: validateFilterDIC,
      prefixWidth: 65, // Compact prefix dropdown
      width: 100, // Enough for 10 digits
    },

    {
      id: 'price_group',
      type: 'multiselect',
      label: 'Skupina',
      field: 'price_group',
      columnId: 'price_group',
      placeholder: 'Vše',
      options: [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' },
      ],
      width: 95,
    },
  ],
};

/**
 * Initial/default filter state for contacts
 */
export const initialContactFilterState: ContactFilterState = {
  search: '',
  is_supplier: false,
  is_customer: false,
  ico: '',
  dic: {
    prefix: null,
    value: '',
  },
  price_group: null,
};

export const defaultVisibleColumnsContact = [
  'ico',
  'company_name',
  'city',
  'email',
  'type',
  'price_group',
];