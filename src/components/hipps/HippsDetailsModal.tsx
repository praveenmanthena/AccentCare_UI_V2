import React from 'react';
import { Calculator, TrendingUp, Award, X } from 'lucide-react';

interface HippsDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hippsScore: string;
  caseMixPoints: number;
  caseMixGroup: string;
  baseRate: number;
  paymentMultiplier: number;
  finalPayment: number;
  oasisScore: number;
  therapyMinutes: number;
}

export const HippsDetailsModal: React.FC<HippsDetailsModalProps> = ({
  isOpen,
  onClose,
  hippsScore,
  caseMixPoints,
  caseMixGroup,
  baseRate,
  paymentMultiplier,
  finalPayment,
  oasisScore,
  therapyMinutes
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-sans">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">HIPPS Payment Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Enhanced HIPPS Score Display */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg px-6 py-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              {/* Case Mix Group */}
              <div className="text-center">
                <div className="text-sm font-semibold opacity-90">HIPPS Code</div>
                <div className="text-2xl font-bold tracking-wider">{hippsScore}</div>
              </div>
              
              {/* Separator */}
              <div className="w-px h-12 bg-blue-400 opacity-50"></div>
              
              {/* Payment Amount */}
              <div className="text-center">
                <div className="text-sm font-semibold opacity-90">Total Payment</div>
                <div className="text-3xl font-bold">${finalPayment.toLocaleString()}</div>
              </div>
              
              {/* Separator */}
              <div className="w-px h-12 bg-blue-400 opacity-50"></div>
              
              {/* Multiplier */}
              <div className="text-center">
                <div className="text-sm font-semibold opacity-90">Payment Multiplier</div>
                <div className="text-2xl font-bold">{paymentMultiplier.toFixed(3)}x</div>
              </div>
              
              {/* Separator */}
              <div className="w-px h-12 bg-blue-400 opacity-50"></div>
              
              {/* HIPPS Points */}
              <div className="text-center">
                <div className="text-sm font-semibold opacity-90">Case Mix Points</div>
                <div className="text-2xl font-bold">{caseMixPoints}</div>
              </div>
            </div>
          </div>

          {/* Payment Calculation Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Payment Calculation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-semibold text-gray-600">Base Rate</div>
                <div className="text-xl font-bold text-gray-800">${baseRate.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-semibold text-gray-600">Multiplier</div>
                <div className="text-xl font-bold text-blue-600">{paymentMultiplier.toFixed(3)}x</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-semibold text-gray-600">Final Payment</div>
                <div className="text-xl font-bold text-green-600">${finalPayment.toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold">
                  {((paymentMultiplier - 1) * 100).toFixed(1)}% above base rate
                </span>
              </div>
            </div>
          </div>

          {/* HIPPS Case Mix Breakdown */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Case Mix Group Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Clinical Severity */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-red-600">{caseMixGroup[0]}</span>
                </div>
                <div className="font-semibold text-gray-800">Clinical</div>
                <div className="text-sm text-gray-600 mt-1">Severity Level</div>
                <div className="text-xs text-gray-500 mt-2">
                  Primary diagnosis complexity and acuity
                </div>
              </div>

              {/* Functional Level */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-green-600">{caseMixGroup[1]}</span>
                </div>
                <div className="font-semibold text-gray-800">Functional</div>
                <div className="text-sm text-gray-600 mt-1">OASIS: {oasisScore}</div>
                <div className="text-xs text-gray-500 mt-2">
                  Patient functional status and independence
                </div>
              </div>

              {/* Service Utilization */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-600">{caseMixGroup[2]}</span>
                </div>
                <div className="font-semibold text-gray-800">Service</div>
                <div className="text-sm text-gray-600 mt-1">Utilization</div>
                <div className="text-xs text-gray-500 mt-2">
                  Expected service intensity and frequency
                </div>
              </div>

              {/* Comorbidity */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-purple-600">{caseMixGroup[3]}</span>
                </div>
                <div className="font-semibold text-gray-800">Comorbidity</div>
                <div className="text-sm text-gray-600 mt-1">Secondary Dx</div>
                <div className="text-xs text-gray-500 mt-2">
                  Additional conditions affecting care
                </div>
              </div>

              {/* Therapy */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-orange-600">{caseMixGroup[4]}</span>
                </div>
                <div className="font-semibold text-gray-800">Therapy</div>
                <div className="text-sm text-gray-600 mt-1">{therapyMinutes} min</div>
                <div className="text-xs text-gray-500 mt-2">
                  Physical, occupational, and speech therapy
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-bold text-blue-800 mb-2">Understanding HIPPS Codes</h4>
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                <strong>HIPPS (Health Insurance Prospective Payment System)</strong> codes determine Medicare reimbursement 
                for home health services based on patient characteristics and care requirements.
              </p>
              <p>
                Each position in the 5-character code represents a different aspect of patient care:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Position 1:</strong> Clinical severity (1-6, higher = more complex)</li>
                <li><strong>Position 2:</strong> Functional status (L=Low, M=Medium, H=High function)</li>
                <li><strong>Position 3:</strong> Service utilization (A-K, higher = more services)</li>
                <li><strong>Position 4:</strong> Comorbidity adjustment (A-F, higher = more conditions)</li>
                <li><strong>Position 5:</strong> Therapy requirements (A-F, higher = more therapy)</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};