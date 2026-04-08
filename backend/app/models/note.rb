class Note < ApplicationRecord
  validates :raw_input, presence: true
end
