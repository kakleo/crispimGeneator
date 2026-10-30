import type { CollectionConfig } from 'payload';

export const Proposals: CollectionConfig = {
  slug: 'proposals',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'proposal_id', 'status', 'tour_type', 'updatedAt'],
  },
  fields: [
    {
      name: 'proposal_id',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Proposal ID (Slug)',
      admin: {
        description: 'URL-friendly identifier, e.g. flores-overland-4d',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Tour Title',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Ready', value: 'ready' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'version',
      type: 'text',
      defaultValue: 'v1',
      label: 'Version',
    },
    {
      name: 'cover_image_url',
      type: 'text',
      label: 'Cover Image URL',
      admin: {
        description: 'URL or path for cover hero image (leave blank for default)',
      },
    },
    {
      name: 'tour_type',
      type: 'text',
      label: 'Tour Type',
      defaultValue: 'Private Tour (Minimum 2 People)',
    },
    {
      name: 'travel_date',
      type: 'text',
      label: 'Travel Date / Year',
      defaultValue: '2026',
    },
    {
      name: 'route',
      type: 'text',
      label: 'Route Summary',
    },
    {
      name: 'intro_text',
      type: 'textarea',
      label: 'Introduction Paragraphs',
    },
    {
      name: 'extra_info',
      type: 'textarea',
      label: 'Extra Information (e.g. Pickup / Dropoff)',
    },
    {
      name: 'custom_html',
      type: 'textarea',
      label: 'Custom HTML (optional)',
    },
    {
      name: 'itinerary',
      type: 'array',
      label: 'Tour Itinerary Days',
      fields: [
        {
          name: 'day_no',
          type: 'number',
          required: true,
          label: 'Day Number',
        },
        {
          name: 'day_title',
          type: 'text',
          required: true,
          label: 'Day Title',
        },
        {
          name: 'items',
          type: 'textarea',
          required: true,
          label: 'Activities / Highlights (one item per line)',
        },
        {
          name: 'accommodation_note',
          type: 'text',
          label: 'Accommodation Note',
          defaultValue: 'See Price List',
        },
        {
          name: 'image_url',
          type: 'text',
          label: 'Polaroid Image URL (optional)',
        },
      ],
    },
    {
      name: 'pricing',
      type: 'array',
      label: 'Price Options',
      fields: [
        {
          name: 'option_label',
          type: 'text',
          required: true,
          label: 'Option Label (e.g. OPTION #1)',
        },
        {
          name: 'stays',
          type: 'textarea',
          label: 'Hotel Stays (one per line, e.g. Day 1: Bintang Lodge Moni)',
        },
        {
          name: 'rows',
          type: 'array',
          label: 'Pricing Variants',
          fields: [
            {
              name: 'row_type',
              type: 'text',
              required: true,
              label: 'Package Type (e.g. Without Tour Guide / Include Tour Guide)',
            },
            {
              name: 'price_amount',
              type: 'number',
              required: true,
              label: 'Price per Person',
            },
            {
              name: 'currency',
              type: 'text',
              defaultValue: 'IDR',
              label: 'Currency',
            },
          ],
        },
      ],
    },
    {
      name: 'inclusions',
      type: 'textarea',
      label: 'Inclusions (one item per line)',
    },
    {
      name: 'exclusions',
      type: 'textarea',
      label: 'Exclusions (one item per line)',
    },
  ],
};
