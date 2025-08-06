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
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from the backend directory
backend_dir = Path(__file__).parent
load_dotenv(backend_dir / '.env')

class RankingService:
    def __init__(self):
        # Initialize Supabase client using the same environment variables as server.py
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')  # Use SERVICE_KEY for backend operations
        
        print(f"🔧 RankingService init - URL exists: {bool(supabase_url)}")
        print(f"🔧 RankingService init - Key exists: {bool(supabase_key)}")
        
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
    
    def get_country_flag(self, country: str) -> str:
        """Get country flag emoji for a given country name"""
        if not country:
            return None
            
        country_flags = {
            'United States': '🇺🇸', 'USA': '🇺🇸', 'US': '🇺🇸',
            'Canada': '🇨🇦', 'CA': '🇨🇦',
            'United Kingdom': '🇬🇧', 'UK': '🇬🇧', 'GB': '🇬🇧',
            'Australia': '🇦🇺', 'AU': '🇦🇺',
            'Germany': '🇩🇪', 'DE': '🇩🇪',
            'France': '🇫🇷', 'FR': '🇫🇷',
            'Spain': '🇪🇸', 'ES': '🇪🇸',
            'Italy': '🇮🇹', 'IT': '🇮🇹',
            'Netherlands': '🇳🇱', 'NL': '🇳🇱',
            'Sweden': '🇸🇪', 'SE': '🇸🇪',
            'Norway': '🇳🇴', 'NO': '🇳🇴',
            'Denmark': '🇩🇰', 'DK': '🇩🇰',
            'Japan': '🇯🇵', 'JP': '🇯🇵',
            'South Korea': '🇰🇷', 'KR': '🇰🇷',
            'Brazil': '🇧🇷', 'BR': '🇧🇷',
            'Mexico': '🇲🇽', 'MX': '🇲🇽'
        }
        return country_flags.get(country, country)
    
    def get_public_leaderboard_data(self) -> List[Dict]:
        """Get all public profiles with complete scores for leaderboard"""
        if not self.supabase:
            raise Exception("Supabase client not initialized")
        
        try:
            # Get all public athlete profiles with their linked user profiles
            # Updated query to work with normalized structure (no personal data in athlete_profiles)
            profiles_response = self.supabase.table('athlete_profiles')\
                .select('''
                    *,
                    user_profiles!inner(
                        user_id,
                        name,
                        display_name,
                        email,
                        date_of_birth,
                        gender,
                        country,
                        height_in,
                        weight_lb,
                        wearables
                    )
                ''')\
                .eq('is_public', True)\
                .not_.is_('hybrid_score', 'null')\
                .order('hybrid_score', desc=True)\
                .execute()
            
            if not profiles_response.data:
                print("⚠️  No public profiles found")
                return []
                
            leaderboard_data = []
            seen_users = set()  # Track users to prevent duplicates
            
            for profile in profiles_response.data:
                user_id = profile.get('user_id')
                
                # Skip if we've already processed this user (prevent duplicates)
                if user_id in seen_users:
                    continue
                    
                seen_users.add(user_id)
                
                # Get user profile data from the joined table
                user_profile = profile.get('user_profiles')
                if not user_profile:
                    print(f"⚠️  No user_profiles data for athlete profile {profile.get('id')}")
                    continue
                
                # Calculate age from date_of_birth
                age = None
                if user_profile.get('date_of_birth'):
                    try:
                        birth_date_str = user_profile['date_of_birth']
                        # Handle both date and datetime formats
                        if 'T' in birth_date_str:
                            birth_date = datetime.fromisoformat(birth_date_str.replace('Z', '+00:00')).date()
                        else:
                            birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
                        
                        today = date.today()
                        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                    except (ValueError, TypeError) as e:
                        print(f"⚠️  Could not parse date_of_birth '{user_profile.get('date_of_birth')}': {e}")
                
                # Get country flag
                country = user_profile.get('country')
                country_flag = self.get_country_flag(country) if country else None
                
                # Extract score data
                score_data = profile.get('score_data', {}) or {}
                hybrid_score = profile.get('hybrid_score', 0)
                
                # Use display_name, fallback to name, fallback to email prefix
                display_name = (
                    user_profile.get('display_name') or 
                    user_profile.get('name') or 
                    (user_profile.get('email', '').split('@')[0] if user_profile.get('email') else 'Anonymous')
                )
                
                leaderboard_entry = {
                    'profile_id': profile.get('id'),
                    'user_id': user_id,
                    'display_name': display_name,
                    'score': hybrid_score,
                    'age': age,
                    'gender': user_profile.get('gender'),
                    'country': country,
                    'country_flag': country_flag,
                    'created_at': profile.get('created_at'),
                    'score_breakdown': {
                        'strengthScore': score_data.get('strengthScore') or profile.get('strength_score'),
                        'speedScore': score_data.get('speedScore') or profile.get('speed_score'),
                        'vo2Score': score_data.get('vo2Score') or profile.get('vo2_score'),
                        'distanceScore': score_data.get('distanceScore') or profile.get('distance_score'),
                        'volumeScore': score_data.get('volumeScore') or profile.get('volume_score'),
                        'recoveryScore': score_data.get('recoveryScore') or profile.get('recovery_score'),
                        'enduranceScore': score_data.get('enduranceScore') or profile.get('endurance_score')
                    }
                }
                
                leaderboard_data.append(leaderboard_entry)
            
            # Sort by hybrid score (highest to lowest) and deduplicate users
            leaderboard_data.sort(key=lambda x: x['score'], reverse=True)
            
            # Deduplicate users - show only highest score per user_id
            seen_users = set()
            deduplicated_data = []
            
            for entry in leaderboard_data:
                user_id = entry.get('user_id')
                if user_id not in seen_users:
                    seen_users.add(user_id)
                    deduplicated_data.append(entry)
                # Skip entries for users we've already seen (they have lower scores due to sorting)
            
            # Add rank to each deduplicated entry
            for i, entry in enumerate(deduplicated_data):
                entry['rank'] = i + 1
            
            return deduplicated_data
            
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

# Global instance for use in server.py - initialized immediately
ranking_service = RankingService()