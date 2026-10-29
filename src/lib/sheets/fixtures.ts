import type { SheetData } from '../schema/types';

export const DEFAULT_FIXTURES: SheetData = {
  settings: [],
  proposals: [
    {
      proposal_id: 'flores-overland-4d',
      status: 'ready',
      version: 'v3',
      title: 'FLORES OVERLAND TOUR 4 DAYS',
      cover_image_url: '',
      intro_text:
        'Please find your detailed tour quotation in the following pages. Thank you for choosing us at Nusa Flores Travel and we hope you will have a memorable journey.\n\nIf you find anything unpleasant during the trip, please do not hesitate to contact us and we will do everything we can to assist you.',
      tour_type: 'Private Tour (Minimum 2 People)',
      travel_date: '2026',
      route: 'Ende - Kelimutu - Bajawa - Ruteng - Labuan Bajo',
      extra_info: '',
      custom_html: '',
      terms_variant: 'standard',
      // Itinerary columns 1 to 12:
      itinerary_1: `Journey to Moni
Picked up at Ende Airport (ENE) Transfer to Moni. On the way stop over in Detusoko, rice field walk.
Visit Wologai Village ; a traditional village lived by Lionese
Stay and overnight at Lodge in Moni
Accommodation: See Price List`,
      itinerary_2: `Kelimutu
Seeing the Kelimutu Lakes at dawn is a truly magical experience. Up at 04:00 you will drive with your driver to the crater lakes through the base of the Kelimutu National Park and walk up to the lakes through early morning woodland.
Sip hot drinks while sunlight wakes the spiritual volcanic crater and learn about local beliefs and folklore. Then explore all three of the ever-changing coloured lakes. This is an unforgettable adventure.
Breakfast at lodge, loading luggage and check out. Drive to Penggajawa
Stop over in Blue stone Beach
Drive to Bajawa, Stay and overnight at Hotel in Bajawa.
Accommodation: See Price List`,
      itinerary_3: `Journey to Ruteng
Breakfast at hotel and check out
First visit Wolobobo view point
Visit Bena Traditional VIllage ; meghalit village lived by Ngadanese tribe
Visit Malanage Hot Spring
Drive to Ruteng, on the way stop over to see arak; local wine distillation process
Stay and overnight at Hotel in Ruteng
Accommodation: See Price List`,
      itinerary_4: `Journey to Labuan bajo
Breakfast at hotel and check out
Visit Cancar spider web rice field.
Drive to Todo, visit Todo Traditional village ; old Manggarai tribe village, These represent one of the oldest kingships, established when the Dutch chose the Todo Clan to rule over Manggarai
Drive to Labuan Bajo and tour finish.
Accommodation: -`,
      pricing: `OPTION #1 | Without Tour Guide | 5000000 | IDR | Bintang Lodge Moni - Day 1; Silverin Hotel Bajawa - Day 2; Sky Flores Hotel Ruteng - Day 3
OPTION #1 | Include Tour Guide | 6100000 | IDR | Bintang Lodge Moni - Day 1; Silverin Hotel Bajawa - Day 2; Sky Flores Hotel Ruteng - Day 3
OPTION #2 | Without Tour Guide | 5000000 | IDR | Spring Hill Hotel Ruteng - Day 3; Sabrina Rest and Living - Day 2; Spring Hill Hotel Ruteng - Day 3
OPTION #2 | Include Tour Guide | 6100000 | IDR | Ecolodge Moni - Day 1; Sabrina Rest and Living - Day 2; Spring Hill Hotel Ruteng - Day 3`,
      inclusions: `Private Car, driver and petrol
Tour Guide
Entrance fee
Mineral water
Accomodation 3 nights
3x Breakfast at Hotel`,
      exclusions: `Flight tickets
Tour guide
Lunch and dinner
Optional tour`,
    },
    {
      proposal_id: 'komodo-dragon-adventure-3d',
      status: 'draft',
      version: 'v1-draft',
      title: 'KOMODO DRAGON ADVENTURE 3 DAYS',
      cover_image_url: '',
      intro_text:
        'Explore the world-famous Komodo National Park on an exclusive liveaboard cruise. Encounter the legendary Komodo Dragons in their natural habitat and swim with manta rays.',
      tour_type: 'Private Phinisi Charter',
      travel_date: '2026',
      route: 'Labuan Bajo - Padar Island - Pink Beach - Komodo Island - Manta Point',
      extra_info: 'Boat: Deluxe Phinisi\nBoarding: Labuan Bajo Port',
      custom_html:
        '<div style="background-color: #f7fee7; border-left: 4px solid #78c24e; padding: 12px; margin-top: 12px;"><p style="font-weight: bold; margin: 0;">Special Note:</p><p style="margin: 4px 0 0 0;">National Park entrance fees are subject to government regulation changes.</p></div>',
      terms_variant: 'standard',
      itinerary_1: `Labuan Bajo - Kelor Island - Manjarite - Kalong
Boarding at Labuan Bajo Harbour at 09:30 AM
Trek to viewpoint of Kelor Island with panoramic ocean vista
Snorkel at Manjarite island with colorful coral reef
Sunset watching thousands of flying foxes at Kalong Island
Accommodation: Cabin on Phinisi Boat`,
      itinerary_2: `Padar Island - Pink Beach - Komodo Island
Sunrise trek to the iconic 3-bay viewpoint of Padar Island
Relax and swim at Pink Beach
Ranger-led trek on Komodo Island to observe Komodo dragons
Overnight mooring in quiet bay
Accommodation: Cabin on Phinisi Boat`,
      itinerary_3: `Manta Point - Taka Makassar - Return
Snorkel with wild manta rays at Manta Point
Visit pristine sandbank of Taka Makassar
Sail back to Labuan Bajo and transfer to hotel/airport
Accommodation: -`,
      pricing: `STANDARD CABIN | Private Charter (up to 4 pax) | 22000000 | IDR | Deluxe Phinisi Boat - 2 Nights`,
      inclusions: `3-day Phinisi private charter with full crew
All meals onboard (Breakfast, Lunch, Dinner)
Snorkeling equipment & life jackets
English speaking tour guide & Komodo park ranger`,
      exclusions: `Komodo National Park entrance fees
Domestic flight to Labuan Bajo (LBJ)
Tipping for boat crew and guide`,
    },
  ],
  itinerary: [],
  pricing: [],
  inclusions: [],
};
