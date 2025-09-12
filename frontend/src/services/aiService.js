import { authenticatedFetch, getApiBaseUrl } from '../utils/api'

class AIService {
  async generateProposal(data) {
    try {
      console.log('AI Service: Sending request with data:', data)
      
      const response = await authenticatedFetch(`${getApiBaseUrl()}/ai/generate-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      console.log('AI Service: Response status:', response.status)
      console.log('AI Service: Response headers:', response.headers)

      // Check if response is ok
      if (!response.ok) {
        console.error('AI Service: Response not ok, status:', response.status)
        
        // Try to get error message from response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
          console.error('AI Service: Error data:', errorData)
        } catch (jsonError) {
          console.error('AI Service: Could not parse error response as JSON:', jsonError)
          // Try to get text response
          try {
            const errorText = await response.text()
            console.error('AI Service: Error response text:', errorText)
            errorMessage = errorText || errorMessage
          } catch (textError) {
            console.error('AI Service: Could not get error response as text:', textError)
          }
        }
        throw new Error(errorMessage)
      }

      // Try to parse response as JSON
      let result
      try {
        const responseText = await response.text()
        console.log('AI Service: Response text:', responseText)
        
        if (!responseText.trim()) {
          throw new Error('Empty response from server')
        }
        
        result = JSON.parse(responseText)
        console.log('AI Service: Parsed result:', result)
      } catch (parseError) {
        console.error('AI Service: JSON parse error:', parseError)
        throw new Error(`Failed to parse server response: ${parseError.message}`)
      }

      return result
    } catch (error) {
      console.error('AI Service: Complete error:', error)
      throw error
    }
  }
}

export const aiService = new AIService()
