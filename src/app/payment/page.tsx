"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowLeft, Shield, CreditCard, Lock } from "lucide-react"
import Link from "next/link"

interface PlanDetails {
  name: string
  price: number
  features: string[]
  color: string
  popular?: boolean
}

const plans: Record<string, PlanDetails> = {
  basic: {
    name: "Basic",
    price: 19,
    features: [
      "Access to workout library",
      "Basic workout tracking",
      "Email support",
      "Mobile app access"
    ],
    color: "bg-gray-800"
  },
  pro: {
    name: "Pro",
    price: 39,
    features: [
      "Everything in Basic",
      "Personalized workout plans",
      "Progress analytics",
      "Priority support",
      "Nutrition guidance"
    ],
    color: "bg-red-500",
    popular: true
  },
  elite: {
    name: "Elite",
    price: 79,
    features: [
      "Everything in Pro",
      "1-on-1 trainer consultation",
      "Custom meal plans",
      "24/7 support",
      "Exclusive content"
    ],
    color: "bg-gray-800"
  }
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentPageContent />
    </Suspense>
  )
}

function PaymentPageContent() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get plan from URL params without useSearchParams
  const [planId, setPlanId] = useState('pro')
  const [plan, setPlan] = useState(plans.pro)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const planParam = urlParams.get('plan') || 'pro'
      setPlanId(planParam)
      setPlan(plans[planParam] || plans.pro)
    }
  }, [])

  useEffect(() => {
    // Load PayPal script
    const script = document.createElement('script')
    script.src = 'https://www.paypal.com/sdk/js?client-id=test&currency=USD'
    script.async = true
    script.onload = () => {
      if (window.paypal) {
        initializePayPal()
      }
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [planId])

  const initializePayPal = () => {
    if (!window.paypal) return

    window.paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [
            {
              description: `WhateverFit ${plan.name} Plan - Monthly Subscription`,
              amount: {
                value: plan.price.toString()
              },
              recurring: {
                frequency: 'MONTH',
                value: plan.price.toString()
              }
            }
          ],
          application_context: {
            shipping_preference: 'NO_SHIPPING'
          }
        })
      },
      onApprove: async (data: any, actions: any) => {
        setIsProcessing(true)
        setError(null)
        
        try {
          const order = await actions.order.capture()
          
          // Here you would typically send the order details to your backend
          // to create the subscription and user account
          console.log('Payment successful:', order)
          
          // Redirect to success page or dashboard
          window.location.href = '/auth/register?plan=' + planId + '&payment=success'
        } catch (error) {
          console.error('Payment failed:', error)
          setError('Payment processing failed. Please try again.')
        } finally {
          setIsProcessing(false)
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err)
        setError('Payment error occurred. Please try again.')
      }
    }).render('#paypal-button-container')
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Plan Not Found</h1>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Complete Your Subscription</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <div>
            <Card className="border-2 border-gray-200">
              <CardHeader className="text-center pb-4">
                {plan.popular && (
                  <Badge className="mx-auto mb-2 bg-red-500 text-white">
                    Most Popular
                  </Badge>
                )}
                <CardTitle className="text-3xl font-bold text-gray-900">{plan.name} Plan</CardTitle>
                <div className="text-5xl font-bold text-red-500">${plan.price}</div>
                <div className="text-gray-500">per month</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-semibold">{plan.name}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Billing Cycle:</span>
                    <span className="font-semibold">Monthly</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-red-500">${plan.price}/month</span>
                  </div>
                </div>

                {/* PayPal Button */}
                <div className="space-y-4">
                  <div id="paypal-button-container"></div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}
                </div>

                {/* Security Notice */}
                <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Secure Payment</p>
                    <p>Your payment is processed securely through PayPal. We never store your payment information.</p>
                  </div>
                </div>

                {/* Terms */}
                <div className="text-xs text-gray-500 text-center">
                  By completing this purchase, you agree to our{' '}
                  <Link href="/terms" className="text-blue-600 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Alternative Payment */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-3">Need help or have questions?</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Link href="/contact">
                      <Button variant="outline" size="sm">
                        Contact Support
                      </Button>
                    </Link>
                    <Link href="/faq">
                      <Button variant="outline" size="sm">
                        View FAQ
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}







