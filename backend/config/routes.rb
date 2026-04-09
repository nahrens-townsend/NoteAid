Rails.application.routes.draw do
  get "health", to: proc { [200, {}, ["ok"]] }

  namespace :api do
    namespace :v1 do
      post "generate-note", to: "notes#create"
    end
  end
end
