class CreateNotes < ActiveRecord::Migration[8.1]
  def change
    create_table :notes do |t|
      t.text :raw_input
      t.text :subjective
      t.text :objective
      t.text :assessment
      t.text :plan
      t.float :confidence
      t.json :flags

      t.timestamps
    end
  end
end
