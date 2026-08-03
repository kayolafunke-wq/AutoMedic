/* eslint-disable camelcase */

/**
 * Add missing fuel_level and odometer_reading columns to inspections table
 * Also adds vehicle_id, customer_id, advisor_id, reference_number if they don't exist
 */

exports.up = (pgm) => {
  // Add columns to inspections table if they don't exist
  pgm.addColumns('inspections', {
    reference_number: { 
      type: 'varchar(255)', 
      unique: true,
      ifNotExists: true 
    },
    vehicle_id: { 
      type: 'varchar(255)', 
      ifNotExists: true 
    },
    customer_id: { 
      type: 'varchar(255)', 
      ifNotExists: true 
    },
    advisor_id: { 
      type: 'varchar(255)', 
      ifNotExists: true 
    },
    odometer_reading: { 
      type: 'integer', 
      ifNotExists: true 
    },
    fuel_level: { 
      type: 'varchar(50)', 
      ifNotExists: true 
    },
    damage_notes: { 
      type: 'text', 
      default: "'[]'",
      ifNotExists: true 
    },
    checklist: { 
      type: 'text', 
      default: "'{}'",
      ifNotExists: true 
    },
    accessories: { 
      type: 'text', 
      default: "'{}'",
      ifNotExists: true 
    },
    valuables_notes: { 
      type: 'text', 
      ifNotExists: true 
    },
    customer_signature: { 
      type: 'text', 
      ifNotExists: true 
    },
    advisor_signature: { 
      type: 'text', 
      ifNotExists: true 
    },
    customer_signed_at: { 
      type: 'timestamp', 
      ifNotExists: true 
    },
  }, { ifNotExists: true })

  // Update any existing inspections to generate reference numbers if missing
  pgm.sql(`
    UPDATE inspections 
    SET reference_number = 'INS-' || LPAD(CAST(FLOOR(1000 + RANDOM() * 9000) AS TEXT), 4, '0')
    WHERE reference_number IS NULL
  `)
}

exports.down = (pgm) => {
  // Rollback - remove the columns added by this migration
  // Note: Be careful with this in production as it will delete data
  pgm.dropColumns('inspections', [
    'fuel_level',
    'odometer_reading',
  ], { ifExists: true })
}
