// =============================================================================
// SEED – Lifetime Achievement Badges (First Release)
// =============================================================================
// This file contains 50 lifetime achievement definitions spread evenly across
// four categories: Distance, Duration, Elevation and Calories.
//
// These badges reward cumulative effort over time, thus, encouraging users to keep
// coming back. Many are themed around real-world landmarks, trails and
// mountains to make the goals feel tangible and inspiring.
//
// Usage:  npx tsx src/db/seed/lifetimeAchievements.ts
// =============================================================================

import db from '../index';
import { achievement_definitions, achievement_rules } from '../schema/achievements';

// Each badge definition paired with its evaluation rules
const lifetimeBadges = [
  // ═══════════════════════════════════════════════════════════════════════════════
  // LIFETIME DISTANCE ACHIEVEMENTS (13 badges)
  // Themed around famous trails, walking paths and iconic distances worldwide.
  // The metric "distance_km" is summed across all sessions to track total distance.
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    definition: {
      code: 'lifetime_distance_parkrun',
      name: 'Parkrun Pioneer',
      description:
        'Accumulate 5 kilometres of total distance - the same length as a standard Parkrun event held in parks across the United Kingdom and beyond.',
      image_url: '/badges/lifetime-distance-parkrun.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'distance_km' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 5.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_distance_royal_parks',
      name: 'Royal Parks Rambler',
      description:
        'Cover 10 kilometres in total - roughly the distance of a leisurely loop through the Royal Parks of London, from Hyde Park to Kensington Gardens and back.',
      image_url: '/badges/lifetime-distance-royal-parks.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'distance_km' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 10.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_distance_half_marathon',
      name: 'Half Marathon Hero',
      description:
        'Reach a lifetime total of 21.1 kilometres - the official half marathon distance. You have covered as much ground as a half marathon runner on a race day!',
      image_url: '/badges/lifetime-distance-half-marathon.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'distance_km' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 21.1,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_distance_marathon',
      name: 'Marathon Legend',
      description:
        'Accumulate 42.2 kilometres in total - the full marathon distance. Whether it took days or weeks, your legs have done the work of a marathon runner!',
      image_url: '/badges/lifetime-distance-marathon.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'distance_km' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 42.2,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_distance_century',
      name: 'Century Strider',
      description:
        'Clock up 100 kilometres of total distance. That is a serious commitment to putting one foot in front of the other!',
      image_url: '/badges/lifetime-distance-century.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'distance_km' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 100.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_distance_thames_path',
      name: 'Thames Path Wanderer',
      description:
        "Reach 135 kilometres in total - the distance from London to Reading along the famous Thames Path, one of England's most beloved riverside trails.",
      image_url: '/badges/lifetime-distance-thames-path.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'distance_km' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 135.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_distance_camino_portugues',
      name: 'Camino Portugués',
      description:
        'Cover 250 kilometres in total - the length of the Portuguese Way pilgrimage route from Porto to Santiago de Compostela in Spain.',
      image_url: '/badges/lifetime-distance-camino-portugues.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'distance_km' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 250.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_distance_pennine_way',
      name: 'Pennine Way Pathfinder',
      description:
        "Accumulate 431 kilometres - the full length of the Pennine Way, England's first official National Trail running from the Peak District to the Scottish Borders.",
      image_url: '/badges/lifetime-distance-pennine-way.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'distance_km' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 431.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_distance_south_west_coast',
      name: 'South West Coast Path Explorer',
      description:
        'Reach 630 kilometres in total - more than half the length of the South West Coast Path, the longest National Trail in England stretching along stunning coastal cliffs.',
      image_url: '/badges/lifetime-distance-south-west-coast.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'distance_km' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 630.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_distance_camino_frances',
      name: 'Camino de Santiago',
      description:
        'Cover 780 kilometres in total - the distance of the Camino Francés, the most popular pilgrimage route to Santiago de Compostela through northern Spain.',
      image_url: '/badges/lifetime-distance-camino-frances.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'distance_km' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 780.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_distance_thousand',
      name: 'Thousand Kilometre Trekker',
      description:
        'Reach the monumental milestone of 1,000 kilometres walked or run on the treadmill. That is a truly extraordinary lifetime achievement!',
      image_url: '/badges/lifetime-distance-thousand.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'distance_km' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 1000.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_distance_lands_end_john_o_groats',
      name: "Land's End to John o' Groats",
      description:
        "Accumulate 1,407 kilometres - the distance of the iconic end-to-end walk across Great Britain from Land's End in Cornwall to John o' Groats in Scotland.",
      image_url: '/badges/lifetime-distance-lands-end-john-o-groats.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'distance_km' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 1407.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_distance_great_wall',
      name: 'Great Wall Voyager',
      description:
        'Reach 2,000 kilometres in total - roughly the walkable length of the Great Wall of China. An incredible testament to your dedication!',
      image_url: '/badges/lifetime-distance-great-wall.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'distance_km' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 2000.0,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LIFETIME DURATION ACHIEVEMENTS (12 badges)
  // Rewarding cumulative time spent exercising on the treadmill.
  // The metric "duration_min" is summed across all sessions.
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    definition: {
      code: 'lifetime_duration_one_hour',
      name: 'First Hour on the Belt',
      description:
        'Spend a total of 1 hour on the treadmill across all your sessions. Your fitness journey is well and truly under way!',
      image_url: '/badges/lifetime-duration-one-hour.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'duration_min' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 60.0, // 1 hour in minutes
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_duration_five_hours',
      name: 'Five Hour Milestone',
      description:
        'Accumulate 5 hours of total treadmill time. That is 300 minutes of building a stronger and healthier you!',
      image_url: '/badges/lifetime-duration-five-hours.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'duration_min' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 300.0, // 5 hours in minutes
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_duration_ten_hours',
      name: 'Ten Hour Tenacity',
      description:
        'Reach 10 hours of total time on the treadmill. Consistency like this builds lasting habits!',
      image_url: '/badges/lifetime-duration-ten-hours.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'duration_min' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 600.0, // 10 hours in minutes
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_duration_full_day',
      name: 'Full Day of Fitness',
      description:
        'Spend a cumulative 24 hours on the treadmill - an entire day devoted to movement and spread across all your sessions!',
      image_url: '/badges/lifetime-duration-full-day.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'duration_min' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 1440.0, // 24 hours in minutes
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_duration_weekend_warrior',
      name: 'Weekend Warrior',
      description:
        'Accumulate 48 hours of treadmill time - the equivalent of an entire weekend spent in motion!',
      image_url: '/badges/lifetime-duration-weekend-warrior.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'duration_min' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 2880.0, // 48 hours in minutes
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_duration_three_day_dedication',
      name: 'Three Day Dedication',
      description:
        'Reach 72 hours of total time exercising on the treadmill - three full days of effort and determination!',
      image_url: '/badges/lifetime-duration-three-day-dedication.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'duration_min' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 4320.0, // 72 hours in minutes
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_duration_century_hours',
      name: 'Century of Hours',
      description:
        'Clock up 100 hours on the treadmill in total. Triple digits - you are officially a dedicated athlete!',
      image_url: '/badges/lifetime-duration-century-hours.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'duration_min' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 6000.0, // 100 hours in minutes
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_duration_one_week',
      name: 'One Week Wonder',
      description:
        'Spend a cumulative 168 hours on the treadmill - a full week of non-stop movement if it were all at once!',
      image_url: '/badges/lifetime-duration-one-week.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'duration_min' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 10080.0, // 168 hours in minutes
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_duration_quarter_thousand',
      name: 'Quarter Thousand Hours',
      description:
        'Accumulate 250 hours of total treadmill time. Your commitment to fitness is truly inspiring!',
      image_url: '/badges/lifetime-duration-quarter-thousand.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'duration_min' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 15000.0, // 250 hours in minutes
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_duration_five_hundred_hours',
      name: 'Five Hundred Hour Hero',
      description:
        'Reach 500 hours on the treadmill. Half a thousand hours of sweat, grit and glory!',
      image_url: '/badges/lifetime-duration-five-hundred-hours.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'duration_min' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 30000.0, // 500 hours in minutes
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_duration_endurance_elite',
      name: 'Endurance Elite',
      description:
        'Accumulate 750 hours on the treadmill in total. You have proven that endurance is your superpower!',
      image_url: '/badges/lifetime-duration-endurance-elite.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'duration_min' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 45000.0, // 750 hours in minutes
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_duration_thousand_hours',
      name: 'Thousand Hour Triumph',
      description:
        'Reach the legendary milestone of 1,000 hours on the treadmill. You have mastered the art of perseverance!',
      image_url: '/badges/lifetime-duration-thousand-hours.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'duration_min' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 60000.0, // 1,000 hours in minutes
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LIFETIME ELEVATION ACHIEVEMENTS (13 badges)
  // Themed around famous mountains and landmarks worldwide plus local areas.
  // The metric "elevation_m" is summed across all sessions to track total climb.
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    definition: {
      code: 'lifetime_elevation_hilltop',
      name: 'Hilltop Hiker',
      description:
        'Gain 100 metres of total elevation - equivalent to climbing a gentle local hill. Every incline counts!',
      image_url: '/badges/lifetime-elevation-hilltop.svg',
      category: 'elevation',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'elevation_m' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 100.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_elevation_eiffel_tower',
      name: 'Eiffel Tower Ascent',
      description:
        'Accumulate 330 metres of elevation gain - the height of the Eiffel Tower in Paris, France. You have climbed an icon!',
      image_url: '/badges/lifetime-elevation-eiffel-tower.svg',
      category: 'elevation',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'elevation_m' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 330.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_elevation_cn_tower',
      name: 'CN Tower Climb',
      description:
        'Reach 553 metres of total elevation gain - the height of the CN Tower in Toronto, Canada. A true vertical achievement!',
      image_url: '/badges/lifetime-elevation-cn-tower.svg',
      category: 'elevation',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'elevation_m' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 553.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_elevation_burj_khalifa',
      name: 'Burj Khalifa Heights',
      description:
        'Gain 828 metres of total elevation - the height of the Burj Khalifa in Dubai, the tallest building in the world!',
      image_url: '/badges/lifetime-elevation-burj-khalifa.svg',
      category: 'elevation',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'elevation_m' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 828.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_elevation_snowdon',
      name: 'Snowdon Summit',
      description:
        'Accumulate 1,085 metres of elevation gain - the height of Yr Wyddfa (Snowdon), the highest peak in Wales and a beloved mountain for hikers.',
      image_url: '/badges/lifetime-elevation-snowdon.svg',
      category: 'elevation',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'elevation_m' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 1085.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_elevation_ben_nevis',
      name: 'Ben Nevis Conqueror',
      description:
        'Reach 1,345 metres of total elevation gain - the height of Ben Nevis, the highest mountain in the British Isles, standing proudly in the Scottish Highlands.',
      image_url: '/badges/lifetime-elevation-ben-nevis.svg',
      category: 'elevation',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'elevation_m' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 1345.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_elevation_mount_kosciuszko',
      name: 'Mount Kosciuszko',
      description:
        'Gain 2,228 metres of total elevation - the height of Mount Kosciuszko, the highest peak on the Australian mainland.',
      image_url: '/badges/lifetime-elevation-mount-kosciuszko.svg',
      category: 'elevation',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'elevation_m' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 2228.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_elevation_mount_fuji',
      name: 'Mount Fuji Ascent',
      description:
        "Accumulate 3,776 metres of elevation gain - the height of Mount Fuji, Japan's iconic sacred volcano and a UNESCO World Heritage Site.",
      image_url: '/badges/lifetime-elevation-mount-fuji.svg',
      category: 'elevation',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'elevation_m' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 3776.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_elevation_matterhorn',
      name: 'Matterhorn Mountaineer',
      description:
        'Reach 4,478 metres of total elevation gain - the height of the Matterhorn, one of the most recognizable peaks in the Alps on the Swiss-Italian border.',
      image_url: '/badges/lifetime-elevation-matterhorn.svg',
      category: 'elevation',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'elevation_m' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 4478.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_elevation_kilimanjaro',
      name: 'Kilimanjaro Climber',
      description:
        "Gain 5,895 metres of total elevation - the height of Mount Kilimanjaro, Africa's tallest mountain rising majestically from the Tanzanian plains.",
      image_url: '/badges/lifetime-elevation-kilimanjaro.svg',
      category: 'elevation',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'elevation_m' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 5895.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_elevation_everest',
      name: 'Everest Summiteer',
      description:
        'Accumulate 8,849 metres of elevation gain - the height of Mount Everest, the highest point on planet Earth. You have reached the top of the world!',
      image_url: '/badges/lifetime-elevation-everest.svg',
      category: 'elevation',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'elevation_m' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 8849.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_elevation_above_the_clouds',
      name: 'Above the Clouds',
      description:
        'Reach 15,000 metres of total elevation gain - higher than any mountain on Earth. You have climbed beyond the clouds themselves!',
      image_url: '/badges/lifetime-elevation-above-the-clouds.svg',
      category: 'elevation',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'elevation_m' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 15000.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_elevation_stratosphere',
      name: 'Stratosphere Seeker',
      description:
        'Accumulate 20,000 metres of elevation gain - reaching the edge of the stratosphere. You have truly defied gravity!',
      image_url: '/badges/lifetime-elevation-stratosphere.svg',
      category: 'elevation',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'elevation_m' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 20000.0,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LIFETIME CALORIES ACHIEVEMENTS (12 badges)
  // Celebrating the total energy burned across all sessions.
  // The metric "calories" is summed across all workouts.
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    definition: {
      code: 'lifetime_calories_five_hundred',
      name: 'First Five Hundred',
      description:
        'Burn a total of 500 calories across all your sessions. Your body is already thanking you for the effort!',
      image_url: '/badges/lifetime-calories-five-hundred.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'calories' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 500.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_calories_one_thousand',
      name: 'Kiloburn',
      description:
        'Accumulate 1,000 calories burned in total. One thousand calories torched and you are well on your way!',
      image_url: '/badges/lifetime-calories-one-thousand.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'calories' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 1000.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_calories_two_thousand_five_hundred',
      name: 'Slow Burn',
      description:
        'Burn a total of 2,500 calories. Slow and steady wins the race and burns the calories!',
      image_url: '/badges/lifetime-calories-two-thousand-five-hundred.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'calories' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 2500.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_calories_five_thousand',
      name: 'Five Thousand Flames',
      description:
        'Reach 5,000 total calories burned. That is the energy equivalent of running roughly 80 kilometres!',
      image_url: '/badges/lifetime-calories-five-thousand.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'calories' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 5000.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_calories_ten_thousand',
      name: 'Ten Thousand Torch',
      description:
        'Burn a total of 10,000 calories across all your workouts. Five digits of pure dedication!',
      image_url: '/badges/lifetime-calories-ten-thousand.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'calories' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 10000.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_calories_twenty_five_thousand',
      name: 'Furnace Mode',
      description:
        'Accumulate 25,000 calories burned. Your metabolism is running like a furnace - keep stoking the fire!',
      image_url: '/badges/lifetime-calories-twenty-five-thousand.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'calories' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 25000.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_calories_fifty_thousand',
      name: 'Fifty Thousand Furnace',
      description:
        'Reach 50,000 total calories burned. That is roughly the energy in 14 pounds of body fat - incredible work!',
      image_url: '/badges/lifetime-calories-fifty-thousand.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'calories' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 50000.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_calories_seventy_five_thousand',
      name: 'Calorie Crusher',
      description:
        'Burn a total of 75,000 calories. You are crushing it - three quarters of the way to a hundred thousand!',
      image_url: '/badges/lifetime-calories-seventy-five-thousand.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'calories' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 75000.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_calories_hundred_thousand',
      name: 'Hundred Thousand Blaze',
      description:
        'Accumulate 1,00,000 calories burned in total. Six figures of fire - you are a force of nature!',
      image_url: '/badges/lifetime-calories-hundred-thousand.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'calories' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 100000.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_calories_one_hundred_fifty_thousand',
      name: 'Inferno Legend',
      description:
        'Reach 1,50,000 total calories burned. You have achieved legendary status in the calorie - burning hall of fame!',
      image_url: '/badges/lifetime-calories-one-hundred-fifty-thousand.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'calories' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 150000.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_calories_quarter_million',
      name: 'Quarter Million Burn',
      description:
        'Burn a staggering 2,50,000 calories in total. A quarter of a million - your perseverance knows no bounds!',
      image_url: '/badges/lifetime-calories-quarter-million.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'calories' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 250000.0,
      },
    ],
  },
  {
    definition: {
      code: 'lifetime_calories_half_million',
      name: 'Half Million Incinerator',
      description:
        'Accumulate 5,00,000 calories burned across all your workouts. Half a million calories - you are an absolute machine!',
      image_url: '/badges/lifetime-calories-half-million.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'calories' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 500000.0,
      },
    ],
  },
];

// ─── Main Seeding Logic ─────────────────────────────────────────────────────
async function seedLifetimeAchievements() {
  console.log('Seeding lifetime achievement badges...\n');

  for (const badge of lifetimeBadges) {
    // Insert the badge definition and retrieve the auto-generated identifier
    const [inserted] = db
      .insert(achievement_definitions)
      .values(badge.definition)
      .returning({ id: achievement_definitions.id })
      .all();

    // Insert each rule linked to the newly created badge definition
    for (const rule of badge.rules) {
      db.insert(achievement_rules)
        .values({
          achievement_id: inserted.id,
          scope: rule.scope,
          metric: rule.metric,
          aggregation: rule.aggregation,
          comparison: rule.comparison,
          target_value: rule.target_value,
          target_min: null,
          target_max: null,
          window_days: null,
        })
        .run();
    }

    console.log(`  ✓ ${badge.definition.name} (${badge.definition.code})`);
  }

  console.log(`\nDone — ${lifetimeBadges.length} lifetime badges seeded successfully.`);
}

seedLifetimeAchievements().catch((error) => {
  console.error('Failed to seed lifetime achievements:', error);
  process.exit(1);
});
