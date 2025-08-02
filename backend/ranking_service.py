#!/usr/bin/env python3
"""
Centralized Ranking Service for Hybrid House
Handles all ranking calculations and leaderboard logic
"""

import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
from supabase import create_client, Client
import json

class RankingService:
    def __init__(self):
        # Initialize Supabase client using the same environment variables as server.py
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')  # Use SERVICE_KEY for backend operations
        
        if supabase_url and supabase_key:
            try:
                self.supabase: Client = create_client(supabase_url, supabase_key)
                print("✅ RankingService: Supabase client initialized successfully")
            except Exception as e:
                print(f"❌ RankingService: Failed to create Supabase client: {e}")
                self.supabase = None
        else:
            print(f"❌ RankingService: Missing environment variables - URL: {bool(supabase_url)}, Key: {bool(supabase_key)}")
            self.supabase = None
    
    def get_public_leaderboard_data(self) -> List[Dict]:
        """Get all public profiles with complete scores for leaderboard"""
        if not self.supabase:
            raise Exception("Supabase client not initialized")
        
        try:
            # Get all public athlete profiles with complete scores
            response = self.supabase.table('athlete_profiles')\
                .select('''
                    id,
                    user_profile_id,
                    profile_json,
                    score_data,
                    is_public,
                    updated_at
                ''')\
                .eq('is_public', True)\
                .not_.is_('score_data', 'null')\
                .execute()
            
            profiles = response.data
            leaderboard_data = []
            
            for profile in profiles:
                score_data = profile.get('score_data', {})
                profile_json = profile.get('profile_json', {})
                
                # Ensure all required scores are present
                required_scores = ['hybridScore', 'strengthScore', 'speedScore', 'vo2Score', 
                                 'distanceScore', 'volumeScore', 'recoveryScore']
                
                if all(score in score_data for score in required_scores):
                    leaderboard_data.append({
                        'profile_id': profile['id'],
                        'user_profile_id': profile['user_profile_id'],
                        'display_name': profile_json.get('display_name', ''),
                        'score': score_data['hybridScore'],
                        'score_breakdown': {
                            'strengthScore': score_data['strengthScore'],
                            'speedScore': score_data['speedScore'], 
                            'vo2Score': score_data['vo2Score'],
                            'distanceScore': score_data['distanceScore'],
                            'volumeScore': score_data['volumeScore'],
                            'recoveryScore': score_data['recoveryScore']
                        },
                        'updated_at': profile['updated_at']
                    })
            
            # Sort by hybrid score (highest to lowest)
            leaderboard_data.sort(key=lambda x: x['score'], reverse=True)
            
            # Add rank to each entry
            for i, entry in enumerate(leaderboard_data):
                entry['rank'] = i + 1
            
            return leaderboard_data
            
        except Exception as e:
            raise Exception(f"Error fetching leaderboard data: {str(e)}")
    
    def calculate_hybrid_ranking(self, user_score: float, user_profile_id: str) -> Tuple[Optional[int], int]:
        """
        Calculate where user ranks among all public profiles
        
        Returns:
            Tuple[position, total_athletes] where:
            - position: User's rank (1-based), None if error
            - total_athletes: Total number of athletes to compare against
        """
        try:
            leaderboard_data = self.get_public_leaderboard_data()
            
            # Check if user is on public leaderboard
            user_position = None
            for i, entry in enumerate(leaderboard_data):
                if entry['profile_id'] == user_profile_id:
                    user_position = entry['rank']
                    break
            
            if user_position is not None:
                # User is on public leaderboard - return actual position
                return user_position, len(leaderboard_data)
            else:
                # User is not on public leaderboard (private profile)
                # Calculate hypothetical position
                hypothetical_position = 1
                for entry in leaderboard_data:
                    if entry['score'] > user_score:
                        hypothetical_position += 1
                    else:
                        break  # Since leaderboard is sorted, we can break early
                
                # Return hypothetical position with total including the user
                return hypothetical_position, len(leaderboard_data) + 1
                
        except Exception as e:
            print(f"Error calculating hybrid ranking: {str(e)}")
            return None, 0
    
    def get_leaderboard_stats(self) -> Dict:
        """Get comprehensive leaderboard statistics"""
        try:
            leaderboard_data = self.get_public_leaderboard_data()
            
            if not leaderboard_data:
                return {
                    'total_public_athletes': 0,
                    'score_range': {'min': 0, 'max': 0},
                    'avg_score': 0,
                    'percentile_breakpoints': {},
                    'last_updated': datetime.utcnow().isoformat()
                }
            
            scores = [entry['score'] for entry in leaderboard_data]
            
            # Calculate percentiles
            percentiles = {}
            for p in [25, 50, 75, 90, 95]:
                index = int((p / 100) * (len(scores) - 1))
                percentiles[f'p{p}'] = scores[index]
            
            return {
                'total_public_athletes': len(leaderboard_data),
                'score_range': {
                    'min': min(scores),
                    'max': max(scores)
                },
                'avg_score': sum(scores) / len(scores),
                'percentile_breakpoints': percentiles,
                'last_updated': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting leaderboard stats: {str(e)}")
            return {
                'total_public_athletes': 0,
                'score_range': {'min': 0, 'max': 0},
                'avg_score': 0,
                'percentile_breakpoints': {},
                'last_updated': datetime.utcnow().isoformat(),
                'error': str(e)
            }
    
    def calculate_age_group_ranking(self, user_score: float, age_group: str) -> Tuple[Optional[int], int]:
        """
        Future: Calculate ranking within specific age group
        
        Args:
            user_score: User's hybrid score
            age_group: Age group string (e.g., "25-29")
            
        Returns:
            Tuple[position, total_athletes_in_age_group]
        """
        # Placeholder for future age-based ranking implementation
        # Will require joining with user_profiles table and filtering by age
        try:
            # TODO: Implement age-based ranking when needed
            # For now, return overall ranking
            return self.calculate_hybrid_ranking(user_score, None)
        except Exception as e:
            print(f"Error calculating age group ranking: {str(e)}")
            return None, 0

    def get_user_percentile(self, user_score: float) -> Optional[float]:
        """Calculate what percentile the user's score represents"""
        try:
            leaderboard_data = self.get_public_leaderboard_data()
            
            if not leaderboard_data:
                return None
                
            scores = [entry['score'] for entry in leaderboard_data]
            scores.append(user_score)  # Add user's score
            scores.sort(reverse=True)  # Sort highest to lowest
            
            user_position = scores.index(user_score) + 1
            percentile = ((len(scores) - user_position) / len(scores)) * 100
            
            return round(percentile, 1)
            
        except Exception as e:
            print(f"Error calculating user percentile: {str(e)}")
            return None

# Global instance for use in server.py - will be initialized when first used
ranking_service = None

def get_ranking_service():
    """Get or create the global ranking service instance"""
    global ranking_service
    if ranking_service is None:
        ranking_service = RankingService()
    return ranking_service