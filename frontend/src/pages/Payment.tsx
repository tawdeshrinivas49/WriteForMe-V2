import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/store/useUser';
import { toast } from 'sonner';
import { getRequestById, createPaymentOrder, verifyPayment } from '@/lib/api';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Payment = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { user, token } = useUser();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    const fetchRequest = async () => {
      try {
        const res = await getRequestById(requestId!);
        setRequest(res.data);
        // Check if already paid
        const tx = res.data.payments?.find((p: any) => p.type === 'PLATFORM_FEE_INBOUND');
        if (tx && (tx.status === 'ESCROWED' || tx.status === 'CAPTURED' || tx.status === 'SUCCESS')) {
          setPaymentStatus('success');
        } else if (tx && tx.status === 'FAILED') {
          setPaymentStatus('failed');
          setErrorMessage(tx.failureReason || 'Payment failed');
        }
      } catch (err: any) {
        console.error('Fetch request error:', err);
        toast.error('Failed to load request');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [requestId, token, navigate, user]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!requestId) return;
    setPaying(true);
    setErrorMessage(null);
    
    try {
      // 1. Create order
      const orderData = await createPaymentOrder(requestId);
      console.log('Order created:', orderData);
      setPaymentData(orderData.data);
      
      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
      }
      
      // 3. Open checkout
      const options = {
        key: orderData.data.keyId,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: 'Write For Me',
        description: `Exam: ${request.examName}`,
        order_id: orderData.data.orderId,
        handler: async (response: any) => {
          console.log('Payment response:', response);
          try {
            // 4. Verify payment with CORRECT field names (camelCase)
            const verifyRes = await verifyPayment({
              requestId: requestId!,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            console.log('Verification response:', verifyRes);
            
            if (verifyRes.success) {
              toast.success('Payment successful! Your request is now active.');
              setPaymentStatus('success');
              setTimeout(() => navigate('/waiting?requestId=' + requestId), 2000);
            } else {
              toast.error(verifyRes.error || 'Payment verification failed. Please contact support.');
              setPaymentStatus('failed');
              setErrorMessage(verifyRes.error || 'Verification failed');
            }
          } catch (err: any) {
            console.error('Verification error:', err);
            const msg = err.response?.data?.error || err.message || 'Verification error';
            toast.error(msg);
            setPaymentStatus('failed');
            setErrorMessage(msg);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast.info('Payment cancelled. You can try again.');
          },
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: {
          color: '#3b82f6',
        },
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      const msg = err.response?.data?.error || err.message || 'Payment initiation failed';
      toast.error(msg);
      setPaymentStatus('failed');
      setErrorMessage(msg);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
        </div>
      </Layout>
    );
  }

  if (!request) return null;

  const amountBreakdown = paymentData?.breakdown || { honorarium: 0, transport: 0, totalINR: 0 };

  return (
    <Layout>
      <section className="py-16 md:py-20 container-narrow">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p><strong>Exam:</strong> {request.examName}</p>
              <p><strong>Candidate:</strong> {user?.name}</p>
              <p><strong>Amount Breakdown:</strong></p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Honorarium: ₹{amountBreakdown.honorarium}</li>
                {request.requiresTransport && (
                  <li>Transport Allowance: ₹{amountBreakdown.transport}</li>
                )}
                <li className="font-bold text-lg">Total: ₹{amountBreakdown.totalINR}</li>
              </ul>
            </div>

            {paymentStatus === 'pending' && (
              <Button
                className="w-full"
                size="lg"
                onClick={handlePayment}
                disabled={paying}
              >
                {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {paying ? 'Processing...' : 'Pay Now'}
              </Button>
            )}

            {paymentStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6" />
                <span>Payment successful! Redirecting...</span>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 text-red-600 p-4 bg-red-50 rounded-lg">
                  <XCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Payment failed</p>
                    <p className="text-sm text-red-500">{errorMessage || 'Please try again or contact support.'}</p>
                  </div>
                </div>
                <Button 
                  variant="default" 
                  className="w-full" 
                  onClick={handlePayment} 
                  disabled={paying}
                >
                  {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Retry Payment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
};

export default Payment;