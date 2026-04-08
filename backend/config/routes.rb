Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      post "generate-note", to: "notes#create"
    end
  end
end
