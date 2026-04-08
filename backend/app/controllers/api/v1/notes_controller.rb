module Api
  module V1
    class NotesController < ApplicationController
      def create
        raw_input = params[:raw_input].to_s.strip

        if raw_input.empty?
          render json: { error: "raw_input is required" }, status: :bad_request
          return
        end

        ai_url = ENV.fetch("AI_SERVICE_URL", "http://localhost:8000")

        begin
          conn = Faraday.new(url: ai_url) do |f|
            f.request :json
            f.response :json
            f.adapter Faraday.default_adapter
          end

          response = conn.post("/process-note") do |req|
            req.body = { raw_input: raw_input }
          end

          if response.success?
            ai_data = response.body

            # rescue AciveRecord::RecordInvalid => e
            # render json: { error: "Failed to save note: #{e.message}" }, status: :unprocessable_entity
            # 
            
            note = Note.new(
              raw_input:   raw_input,
              subjective:  ai_data["subjective"],
              objective:   ai_data["objective"],
              assessment:  ai_data["assessment"],
              plan:        ai_data["plan"],
              confidence:  ai_data["confidence"],
              flags:       ai_data["flags"]
            )

            if note.save
              render json: {
                id:          note.id,
                subjective:  note.subjective,
                objective:   note.objective,
                assessment:  note.assessment,
                plan:        note.plan,
                confidence:  note.confidence,
                flags:       note.flags
              }, status: :created
            else
              render json: { error: "Failed to save note", errors: note.errors.full_messages }, status: :unprocessable_entity
            end
          else
            render json: { error: "AI service returned an error" }, status: :bad_gateway
          end

        rescue Faraday::ConnectionFailed, Faraday::TimeoutError => e
          render json: { error: "Could not reach AI service: #{e.message}" }, status: :bad_gateway
        end
      end
    end
  end
end
